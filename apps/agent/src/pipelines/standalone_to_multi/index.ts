import { getGithubInstallationClient } from "@lib/github";
import { RepositoryWalker } from "@lib/github/repository";
import { Page, Project, Repository } from "database";
import { z } from "zod";
import { createPlanAgentExecutor } from "~/agents/plan_agent";
import { FileWrite } from "~/tools/write_file";
import { planSystemPrompt, userPrompt } from "./messages";
import { TraceGroup } from "langchain/callbacks";
import { writeFileSync } from "fs";

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
    const { output, intermediateSteps } = await planAgent.call(
      {
        input: page.standaloneCode,
        chat_history: [],
      },
      { callbacks }
    );

    return "";
  } finally {
    await traceGroup.end();
  }
}
