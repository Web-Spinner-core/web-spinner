import { FileWrite } from "@lib/github";
import { RepositoryWalker } from "@lib/github/repository";
import { AgentExecutor } from "langchain/agents";
import { Callbacks } from "langchain/callbacks";
import { z } from "zod";
import ListAllFilesTool from "~/tools/list_all_files";
import ObjectiveTool from "~/tools/objective_tool";
import { serializeFunctionCall } from "~/tools/util";
import WriteFileTool from "~/tools/write_file";
import { createAgentExecutor } from "./base";
import CreateComponentTool from "~/tools/create_component";
import CreatePageTool from "~/tools/create_page";
import ReadFileTool from "~/tools/read_file";

interface CreateDevAgentOptions {
  walker: RepositoryWalker;
  systemPrompt: string;
  writeAccumulator: (file: FileWrite) => void;

  userPrompt?: string;
  temperature?: number;
  modelName?: string;
  callbacks?: Callbacks;
  shouldCache?: boolean;
}

const objectiveName = "save_and_exit";
const objectiveDescription = "Save all changes and exit";
const objectiveSchema = z.object({});

/**
 * Create an agent to implement the changes planned by the plan agent
 */
export async function createDevAgentExecutor(
  args: CreateDevAgentOptions
): Promise<AgentExecutor> {
  const {
    walker,
    systemPrompt,
    writeAccumulator,
    userPrompt,
    temperature,
    modelName,
    callbacks,
    shouldCache
  } = args;

  const toolParams = { callbacks };

  const writeFileTool = new WriteFileTool(writeAccumulator, toolParams)
  const tools = [
    new CreateComponentTool(writeFileTool, toolParams),
    new CreatePageTool(writeFileTool, toolParams),
    new ReadFileTool(walker, toolParams),
    new ObjectiveTool(
      objectiveSchema,
      objectiveDescription,
      objectiveName,
      toolParams
    ),
  ];

  // const listAllFilesTool = new ListAllFilesTool(walker, toolParams);
  // const files = await listAllFilesTool.call({}, toolParams);
  // const prior = serializeFunctionCall(listAllFilesTool, "", files);

  return createAgentExecutor({
    userPrompt,
    systemPrompt,
    temperature,
    modelName,
    callbacks,
    tools,
    // prior,
    shouldCache
  });
}
