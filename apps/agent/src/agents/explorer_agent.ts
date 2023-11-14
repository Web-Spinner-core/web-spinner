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
  } = args;

  // Repository exploration tools
  const listFilesTool = new ListFilesTool(walker);
  const tools: StructuredTool[] = [listFilesTool, new ReadFileTool(walker)];
  if (canWrite) {
    // Add write capabilities
    tools.push(new WriteFileTool(args.writeOptions.accumulator));
  }

  if (objective) {
    // Declare objective function
    tools.push(
      new SaveAnalysisTool(
        objective.objectiveSchema,
        objective.objectiveDescription,
        objective.objectiveFunctionName
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
    modelName: modelName ?? "gpt-3.5-turbo-16k",
    openAIApiKey: env.OPENAI_API_KEY,
    temperature: temperature ?? 0,
  });
  model.predictMessages;

  // Executors
  const chain = new LLMChain({
    prompt: promptTemplate,
    llm: new ChatOpenAI({
      modelName: modelName ?? "gpt-3.5-turbo-16k",
      openAIApiKey: env.OPENAI_API_KEY,
      temperature: temperature ?? 0,
    }),
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
  });
}
