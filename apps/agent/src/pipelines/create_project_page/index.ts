import { Repository } from "database";
import { getGithubInstallationClient } from "@lib/github";
import { RepositoryWalker } from "@lib/github/repository";
import GithubRepositoryClient from "@lib/github/repository_client";
import { FileWrite } from "~/tools/write_file";
import { createExplorerAgentExecutor } from "../../agents/explorer_agent";
import { createPullRequestTitle } from "../pull_request_title";
import { getStarterMessages, systemPrompt, userPrompt } from "./messages";
import { z } from "zod";

export const objectiveSchema = z.object({
  files: z
    .string()
    .array()
    .describe("The paths to the files that were created"),
});

const objectiveFunctionName = "record_files";
const objectiveDescription = "Record the new files that were created";

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

  const fileWrites: FileWrite[] = [];
  const accumulator = (file: FileWrite) => {
    fileWrites.push(file);
  };

  const explorer = await createExplorerAgentExecutor({
    walker,
    systemPrompt,
    userPrompt,
    canWrite: true,
    writeOptions: { accumulator },
    objective: {
      objectiveSchema,
      objectiveDescription,
      objectiveFunctionName,
    },
    temperature: 0.7,
    modelName: "gpt-4-1106-preview",
  });

  const starterMessages = await getStarterMessages(walker, repository);
  const result = await explorer.call({
    input: description,
    chat_history: starterMessages,
  });

  // Create a pull request
  const repositoryClient = new GithubRepositoryClient(
    installationClient,
    repository
  );

  const title = await createPullRequestTitle(description);

  await repositoryClient.createPullRequestFromFiles(
    "main",
    fileWrites,
    `[Web Spinner] ${title}`,
    description
  );

  return result;
}
