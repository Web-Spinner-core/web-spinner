import { Repository } from "database";
import { getGithubInstallationClient } from "@lib/github";
import { RepositoryWalker } from "@lib/github/repository";
import GithubRepositoryClient from "@lib/github/repository_client";
import { FileWrite } from "~/tools/write_file";
import { createExplorerAgentExecutor } from "../../agents/explorer_agent";
import { createPullRequestTitle } from "../pull_request_title";
import {
  getStarterMessages,
  systemPrompt,
  userPrompt,
  reminderPrompt,
} from "./messages";
import { z } from "zod";
import renderStandalonePage from "./render_standalone_page";
import { TraceGroup } from "langchain/callbacks";

export const objectiveSchema = z.object({
  files: z
    .string()
    .array()
    .describe("The paths to the files that were created"),
});

const objectiveFunctionName = "finish_changes";
const objectiveDescription =
  "Mark all changes as complete and ready for review.";

/**
 * Create a page with vision support
 */
export async function createPageWithVision(
  repository: Repository,
  description: string,
  imageUrl: string,
  issueNum: number
) {
  // Observability group
  const traceGroup = new TraceGroup("create_page_with_vision");
  const callbacks = await traceGroup.start();
  try {
    // Prepare repository tools
    const installationClient = getGithubInstallationClient(
      repository.installationId
    );
    const [owner, repo] = repository.fullName.split("/");
    const walker = new RepositoryWalker(installationClient, owner, repo);

    const fileWrites: FileWrite[] = [];
    const accumulator = (file: FileWrite) => {
      fileWrites.push(file);
    };

    // Initialize agent
    const explorer = await createExplorerAgentExecutor({
      walker,
      systemPrompt,
      reminderPrompt,
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
      callbacks,
    });

    // Prepare starter messages
    const renderedTemplate = await renderStandalonePage(
      description,
      imageUrl,
      callbacks
    );
    const starterMessages = await getStarterMessages(
      walker,
      repository,
      renderedTemplate,
      callbacks
    );

    // Execute
    const result = await explorer.call(
      {
        input: description,
        chat_history: starterMessages,
      },
      { callbacks }
    );

    if (fileWrites.length == 0) {
      throw new Error("No files were created");
    }

    // Create pull request
    const repositoryClient = new GithubRepositoryClient(
      installationClient,
      repository
    );
    const title = await createPullRequestTitle(description, callbacks);

    await repositoryClient.createPullRequestFromFiles(
      "main",
      fileWrites,
      `[Web Spinner] ${title}`,
      `Resolves #${issueNum}\n\n## Summary\n${description}`
    );

    return result;
  } finally {
    await traceGroup.end();
  }
}
