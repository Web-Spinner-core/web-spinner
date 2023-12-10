import { RepositoryWalker } from "@lib/github/repository";
import { AgentExecutor } from "langchain/agents";
import { Callbacks } from "langchain/callbacks";
import { z } from "zod";
import ObjectiveTool from "~/tools/objective_tool";
import ReadFileTool from "~/tools/read_file";
import { createAgentExecutor } from "./base";
import ListAllFilesTool from "~/tools/list_all_files";
import { serializeFunctionCall } from "~/tools/util";
import { BaseMessage } from "langchain/schema";

interface CreatePlanAgentOptions {
  walker: RepositoryWalker;
  systemPrompt: string;

  userPrompt?: string;
  temperature?: number;
  modelName?: string;
  callbacks?: Callbacks;
  shouldCache?: boolean;
}

const objectiveName = "save_plan";
const objectiveDescription =
  "Declare and save a plan for what components and pages to create.";
const objectiveSchema = z.object({
  components: z
    .string()
    .array()
    .describe("The names of the React components that will be created"),
  pages: z
    .string()
    .array()
    .describe(
      'The HTTP path to the pages that will be created, e.g. "/users/[id]"'
    ),
});

/**
 * Create an agent to plan what components and pages to create
 */
export async function createPlanAgentExecutor(
  args: CreatePlanAgentOptions
): Promise<AgentExecutor> {
  const {
    walker,
    userPrompt,
    systemPrompt,
    temperature,
    modelName,
    callbacks,
    shouldCache,
  } = args;

  const toolParams = { callbacks };

  const readFileTool = new ReadFileTool(walker, toolParams);
  const tools = [
    readFileTool,
    new ObjectiveTool(
      objectiveSchema,
      objectiveDescription,
      objectiveName,
      toolParams
    ),
  ];

  const prior = await getPrior(walker, toolParams);

  return createAgentExecutor({
    userPrompt,
    systemPrompt,
    temperature,
    modelName,
    callbacks,
    tools,
    prior,
    shouldCache,
    returnIntermediateSteps: true,
  });
}

/**
 * Get the prior messages
 */
async function getPrior(
  walker: RepositoryWalker,
  toolParams: { callbacks?: Callbacks }
): Promise<BaseMessage[]> {
  const listAllFilesTool = new ListAllFilesTool(walker, toolParams);
  const readFileTool = new ReadFileTool(walker, toolParams);

  const files = await listAllFilesTool.call({}, toolParams);
  const listAllFilesMessages = serializeFunctionCall(
    listAllFilesTool,
    "",
    files
  );
  const seedFiles: string[] = [
    // "src/app/layout.tsx",
    // "src/app/loading.tsx",
    // "src/app/page.tsx",
    // "src/app/account/page.tsx",
  ];
  const fileContents = await Promise.all(
    seedFiles.map(async (path) => {
      const content = await readFileTool.call({ path }, toolParams);
      return serializeFunctionCall(
        readFileTool,
        JSON.stringify({ path }),
        content
      );
    })
  );
  const fileMessages = fileContents.flat();
  const prior = [...listAllFilesMessages, ...fileMessages];
  return prior;
}
