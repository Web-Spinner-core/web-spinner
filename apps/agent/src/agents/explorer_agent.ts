import { AgentExecutor, OpenAIAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import { StructuredTool } from "langchain/tools";
import { env } from "~/env";
import { RepositoryWalker } from "~/lib/github/repository";
import ListFilesTool from "../tools/list_files";
import ReadFileTool from "../tools/read_file";
import SaveAnalysisTool from "../tools/save_analysis";
import { ToolSchema } from "../tools/util";
import WriteFileTool, { FileWriteAccumulator } from "../tools/write_file";
import { Callbacks } from "langchain/callbacks";

interface CreateExplorerAgentBaseOptions<T extends ToolSchema> {
  walker: RepositoryWalker;
  systemPrompt: string;
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
    tools.push(new WriteFileTool(args.writeOptions.accumulator, { callbacks }));
  }

  if (objective) {
    // Declare objective function
    tools.push(
      new SaveAnalysisTool(
        objective.objectiveSchema,
        objective.objectiveDescription,
        objective.objectiveFunctionName,
        { callbacks }
      )
    );
  }

  // Prompt
  const promptTemplate = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemPrompt),
    HumanMessagePromptTemplate.fromTemplate(userPrompt ?? "{input}"),
    new MessagesPlaceholder("chat_history"),
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const model = new ChatOpenAI({
    modelName: modelName ?? "gpt-4-1106-preview",
    openAIApiKey: env.OPENAI_API_KEY,
    temperature: temperature ?? 0,
  });
  model.predictMessages;

  // Executors
  const chain = new LLMChain({
    prompt: promptTemplate,
    llm: new ChatOpenAI({
      modelName: modelName ?? "gpt-4-1106-preview",
      openAIApiKey: env.OPENAI_API_KEY,
      temperature: temperature ?? 0,
    }),
    callbacks,
  });
  const agent = new OpenAIAgent({
    llmChain: chain,
    allowedTools: tools.map((tool) => tool.name),
    tools,
  });

  return new AgentExecutor({
    agent,
    tools,
    verbose: true,
    maxIterations: 10,
    callbacks,
  });
}
