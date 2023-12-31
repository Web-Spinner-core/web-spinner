import { Repository, prisma } from "database";
import { BaseMessage } from "langchain/schema";
import { z } from "zod";
import { getGithubInstallationClient } from "@lib/github";
import { RepositoryWalker } from "@lib/github/repository";
import ListFilesTool from "~/tools/list_files";
import { serializeFunctionCall } from "~/tools/util";
import { createExplorerAgentExecutor } from "../agents/explorer_agent";
import { Callbacks } from "langchain/callbacks";

const systemPrompt = `You are an expert frontend web developer. You are analyzing the directory structure of a new repository that uses React and Next.js.
You need to identify four important directories in the repository:
1) Where new pages are created
2) Where new components are created
3) Where new styles are created (if separate)
4) Where utilities are created

Always call one of the provided functions to either submit your analysis or request more information.`;

export const objectiveSchema = z.object({
  pages: z
    .string()
    .describe("The path to the directory where new pages are created"),
  components: z
    .string()
    .describe("The path to the directory where new components are created"),
  utilities: z
    .string()
    .describe("The path to the directory where utilities are created"),
  styles: z
    .string()
    .optional()
    .describe("The path to the directory where new styles are created"),
});

const objectiveDescription = "Identify important directories in the repository";

/**
 * Get starter messages containing files in the root directory
 */
export async function getStarterMessages(
  walker: RepositoryWalker,
  callbacks?: Callbacks
): Promise<BaseMessage[]> {
  const listFilesTool = new ListFilesTool(walker, { callbacks });
  const seedFiles = await listFilesTool.call({ path: "" }, { callbacks });

  return serializeFunctionCall(
    listFilesTool,
    JSON.stringify({ directory: "" }),
    seedFiles
  );
}

/**
 * Identify directories in repository that need to be modified for development
 */
export async function identifyDirectories(repository: Repository) {
  const installationClient = getGithubInstallationClient(
    repository.installationId
  );
  const [owner, repo] = repository.fullName.split("/");
  const walker = new RepositoryWalker(installationClient, owner, repo);

  const explorer = await createExplorerAgentExecutor({
    walker,
    systemPrompt,
    canWrite: false,
    objective: { objectiveSchema, objectiveDescription },
  });

  const starterMessages = await getStarterMessages(walker);
  const result = await explorer.call({
    input: "",
    chat_history: starterMessages,
  });

  const analysis = objectiveSchema.parse(JSON.parse(result.output));
  await prisma.repository.update({
    where: { id: repository.id },
    data: {
      directoryAnalysis: analysis,
    },
  });

  return analysis;
}
