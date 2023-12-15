import { AgentExecutor, OpenAIAgent } from "langchain/agents";
import { Callbacks } from "langchain/callbacks";
import { LLMChain } from "langchain/chains";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import { StructuredTool } from "langchain/tools";
import { RepositoryWalker } from "@lib/github/repository";
import { createChatModel } from "@lib/openai";
import UpdateFileTool from "~/tools/update_file";
import ListFilesTool from "../tools/list_files";
import ReadFileTool from "../tools/read_file";
import ObjectiveTool from "../tools/objective_tool";
import { ToolSchema } from "../tools/util";
import WriteFileTool, { FileWriteAccumulator } from "../tools/write_file";
import { createAgentExecutor } from "./base";

interface CreateExplorerAgentBaseOptions<T extends ToolSchema> {
  walker: RepositoryWalker;
  systemPrompt: string;
  reminderPrompt?: string;
  userPrompt?: string;
  objective?: {
    objectiveSchema: T;
    objectiveDescription: string;
    objectiveFunctionName?: string;
  };
  temperature?: number;
  modelName?: string;
  callbacks?: Callbacks;
}

interface CreateExplorerAgentReadonlyOptions<T extends ToolSchema>
  extends CreateExplorerAgentBaseOptions<T> {
  canWrite: false;
}

interface CreateExplorerAgentWritableOptions<T extends ToolSchema>
  extends CreateExplorerAgentBaseOptions<T> {
  canWrite: true;
  writeOptions: {
    accumulator: FileWriteAccumulator;
  };
}

type CreateExplorerAgentOptions<T extends ToolSchema> =
  | CreateExplorerAgentReadonlyOptions<T>
  | CreateExplorerAgentWritableOptions<T>;

/**
 * Create an agent to solve a specific agent
 */
export async function createExplorerAgentExecutor<T extends ToolSchema>(
  args: CreateExplorerAgentOptions<T>
): Promise<AgentExecutor> {
  const {
    walker,
    systemPrompt,
    reminderPrompt,
    userPrompt,
    objective,
    temperature,
    modelName,
    canWrite,
    callbacks,
  } = args;

  // Repository exploration tools
  const listFilesTool = new ListFilesTool(walker, { callbacks });
  const tools: StructuredTool[] = [
    listFilesTool,
    new ReadFileTool(walker, { callbacks }),
  ];
  if (canWrite) {
    // Add write capabilities
    tools.push(
      new WriteFileTool(args.writeOptions.accumulator, {
        callbacks,
      })
    );
    tools.push(
      new UpdateFileTool(args.writeOptions.accumulator, {
        callbacks,
      })
    );
  }

  if (objective) {
    // Declare objective function
    tools.push(
      new ObjectiveTool(
        objective.objectiveSchema,
        objective.objectiveDescription,
        objective.objectiveFunctionName,
        { callbacks }
      )
    );
  }

  return createAgentExecutor({
    systemPrompt,
    userPrompt,
    reminderPrompt,
    temperature,
    modelName,
    callbacks,
    tools,
    returnIntermediateSteps: true,
    shouldCache: false
  });
}
