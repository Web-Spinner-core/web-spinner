import { getGithubInstallationClient } from "@lib/github";
import { RepositoryWalker } from "@lib/github/repository";
import GithubRepositoryClient from "@lib/github/repository_client";
import { Page, Project, Repository } from "database";
import { BaseCallbackHandler, TraceGroup } from "langchain/callbacks";
import { AIMessage, BaseMessage, FunctionMessage } from "langchain/schema";
import { z } from "zod";
import { createDevAgentExecutor } from "~/agents/dev_agent";
import { createPlanAgentExecutor } from "~/agents/plan_agent";
import { FileWrite } from "~/tools/write_file";
import { devSystemPrompt, planSystemPrompt, userPrompt } from "./messages";

export const objectiveSchema = z.object({
  files: z
    .string()
    .array()
    .describe("The paths to the files that were created"),
});

const objectiveFunctionName = "record_files";
const objectiveDescription = "Record the new files that were created";

type PopulatedPage = Page & {
  project: Project & {
    repository: Repository;
  };
};

interface IntermediateStep {
  action: {
    messageLog: BaseMessage[];
  };
  observation: string;
}

/**
 * Create a diff for multi-file changes from a standalone
 */
export async function createMultiFromStandalonePage(page: PopulatedPage) {
  // Observability group
  const traceGroup = new TraceGroup("create_multi_from_standalone");
  const callbacks = await traceGroup.start();

  try {
    const repository = page.project.repository;
    const installationClient = getGithubInstallationClient(
      repository.installationId
    );
    const [owner, repo] = repository.fullName.split("/");
    const walker = new RepositoryWalker(installationClient, owner, repo);

    const fileWrites: FileWrite[] = [];
    const accumulator = (file: FileWrite) => {
      fileWrites.push(file);
    };

    const planAgent = await createPlanAgentExecutor({
      walker,
      systemPrompt: planSystemPrompt,
      userPrompt,
      temperature: 0.1,
      modelName: "gpt-4-1106-preview",
      callbacks,
      shouldCache: false,
    });

    const messageQueue = [] as BaseMessage[][];
    const handler = BaseCallbackHandler.fromMethods({
      handleChatModelStart(llm, [incoming]) {
        messageQueue.push(incoming);
      },
    });
    callbacks.addHandler(handler);

    const { output } = await planAgent.call(
      {
        input: page.standaloneCode,
        chat_history: [],
      },
      { callbacks }
    );

    const messages = messageQueue?.pop();
    if (!messages?.length) {
      throw new Error("No messages were generated");
    }
    messages.push(
      new AIMessage({
        content: "",
        additional_kwargs: {
          function_call: {
            name: "save_plan",
            arguments: output,
          },
        },
      }),
      new FunctionMessage({
        name: "save_plan",
        content: "true",
      })
    );

    const devAgent = await createDevAgentExecutor({
      walker,
      systemPrompt: devSystemPrompt,
      userPrompt,
      temperature: 0.7,
      modelName: "gpt-4-1106-preview",
      callbacks,
      writeAccumulator: accumulator,
      shouldCache: true,
    });
    await devAgent.call(
      {
        input: page.standaloneCode,
        // Remove system message and user message
        chat_history: messages.slice(2),
      },
      { callbacks }
    );

    // Create pull request
    const repositoryClient = new GithubRepositoryClient(
      installationClient,
      repository
    );

    await repositoryClient.createPullRequestFromFiles(
      "main",
      fileWrites,
      `Create page: ${page.name}`,
      `Web Spinner created this PR`
    );

    return true;
  } finally {
    await traceGroup.end();
  }
}
