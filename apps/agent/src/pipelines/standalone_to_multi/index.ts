import { getGithubInstallationClient } from "@lib/github";
import { RepositoryWalker } from "@lib/github/repository";
import GithubRepositoryClient from "@lib/github/repository_client";
import { Page, Project, Repository } from "database";
import { TraceGroup } from "langchain/callbacks";
import { BaseMessage } from "langchain/schema";
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
      temperature: 0.7,
      modelName: "gpt-4-1106-preview",
      callbacks,
    });
    const { intermediateSteps } = await planAgent.call(
      {
        input: page.standaloneCode,
        chat_history: [],
      },
      { callbacks }
    );
    const messages = (intermediateSteps as IntermediateStep[]).flatMap(
      (step) => step.action.messageLog
    );

    const devAgent = await createDevAgentExecutor({
      walker,
      systemPrompt: devSystemPrompt,
      userPrompt,
      temperature: 0.7,
      modelName: "gpt-4-1106-preview",
      callbacks,
      writeAccumulator: accumulator,
    });
    await devAgent.call(
      {
        input: page.standaloneCode,
        chat_history: messages,
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
