import { RepositoryWalker } from "@lib/github/repository";
import { AgentExecutor } from "langchain/agents";
import { Callbacks } from "langchain/callbacks";
import { z } from "zod";
import ObjectiveTool from "~/tools/objective_tool";
import ReadFileTool from "~/tools/read_file";
import { createAgentExecutor } from "./base";
import ListAllFilesTool from "~/tools/list_all_files";
import { serializeFunctionCall } from "~/tools/util";
import WriteFileTool from "~/tools/write_file";
import { FileWrite } from "@lib/github";

interface CreateDevAgentOptions {
  walker: RepositoryWalker;
  systemPrompt: string;
  writeAccumulator: (file: FileWrite) => void;

  userPrompt?: string;
  temperature?: number;
  modelName?: string;
  callbacks?: Callbacks;
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
  } = args;

  const toolParams = { callbacks };
  const tools = [
    new WriteFileTool(writeAccumulator, toolParams),
    new ObjectiveTool(
      objectiveSchema,
      objectiveDescription,
      objectiveName,
      toolParams
    ),
  ];

  return createAgentExecutor({
    userPrompt,
    systemPrompt,
    temperature,
    modelName,
    callbacks,
    tools,
    prior,
    returnIntermediateSteps: true,
  });
}
