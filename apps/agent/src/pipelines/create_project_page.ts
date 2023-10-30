import { Repository } from "database";
import { z } from "zod";
import { getGithubInstallationClient } from "~/lib/github";
import { RepositoryWalker } from "~/lib/github/repository";
import { ListFilesTool } from "~/tools/list_files";
import { serializeFunctionCall } from "~/tools/util";
import { createExplorerAgentExecutor } from "../agents/explorer_agent";
import {
  getStarterMessages as getDirectoryStarterMessages,
  objectiveSchema as repositoryAnalysisSchema,
} from "./identify_directories";

const prompt = `You are an expert frontend web developer. You have already identified what directories you need to modify to \
create new pages, components, and styles. Now, you are ready to create a new page. Modularize the code where it makes sense, by creating components \
in the appropriate directories. Use existing components and styles where possible. If you need to create additional style files or utilities, \
make sure to write them as well.

#################
Create a page with the following description:
{input}
#################

If you need to create multiple files, you can call the provided tools multiple times.
You MUST ALWAYS use one of the provided tools to explore the repository, write to a file, or exit with a list of files that were written to.`;

export const objectiveSchema = z.object({
  files: z
    .string()
    .array()
    .describe("The paths to the files that were created"),
});

const objectiveFunctionName = "record_files";
const objectiveDescription = "Record the new files that were created";

export async function getStarterMessages(
  walker: RepositoryWalker,
  repository: Repository
) {
  const directoryStarterMessages = await getDirectoryStarterMessages(walker);
  const directories = repositoryAnalysisSchema.parse(
    repository.directoryAnalysis
  );

  const messages = directoryStarterMessages;
  const listFilesTool = new ListFilesTool(walker);
  for (const directory of Object.values(directories)) {
    if (directory) {
      const files = await walker.getFiles(directory);
      const functionCallMessages = serializeFunctionCall(
        listFilesTool,
        JSON.stringify({ directory }),
        JSON.stringify(files)
      );
      messages.push(...functionCallMessages);
    }
  }
  return messages;
}

/**
 * Create a page using the project's existing theme and design language
 */
export async function createProjectPage(
  repository: Repository,
  description: string
) {
  const installationClient = getGithubInstallationClient(
    repository.installationId
  );
  const [owner, repo] = repository.fullName.split("/");
  const walker = new RepositoryWalker(installationClient, owner, repo);

  const explorer = await createExplorerAgentExecutor({
    walker,
    prompt,
    canWrite: true,
    objective: {
      objectiveSchema,
      objectiveDescription,
      objectiveFunctionName,
    },
    temperature: 0.7,
    modelName: "gpt-3.5-turbo-16k",
  });

  const starterMessages = await getStarterMessages(walker, repository);
  const result = await explorer.call({
    input: description,
    chat_history: starterMessages,
  });

  return result;
}
