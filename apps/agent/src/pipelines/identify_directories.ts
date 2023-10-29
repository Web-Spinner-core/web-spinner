import { Repository, prisma } from "database";
import { AIMessage, BaseMessage, FunctionMessage } from "langchain/schema";
import { z } from "zod";
import { getGithubInstallationClient } from "~/lib/github";
import { RepositoryWalker } from "~/lib/github/repository";
import { ListFilesTool } from "~/tools/list_files";
import { createExplorerAgentExecutor } from "../agents/explorer_agent";

const prompt = `You are an expert frontend web developer. You are analyzing the directory structure of a new repository that uses React and Next.js.
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
 * Get starter messages for identifying directories
 */
export async function getStarterMessages(
  walker: RepositoryWalker
): Promise<BaseMessage[]> {
  const listFilesTool = new ListFilesTool(walker);
  const seedFiles = await listFilesTool.call({ directory: "" });

  return [
    new AIMessage({
      content: "",
      additional_kwargs: {
        function_call: {
          name: listFilesTool.name,
          arguments: JSON.stringify({ directory: "" }),
        },
      },
    }),
    new FunctionMessage(seedFiles, listFilesTool.name),
  ];
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
    prompt,
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
