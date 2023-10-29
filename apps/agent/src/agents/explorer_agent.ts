import { AgentExecutor, OpenAIAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import { StructuredTool } from "langchain/tools";
import { env } from "~/env";
import { RepositoryWalker } from "~/lib/github/repository";
import { ListFilesTool } from "../tools/list_files";
import ReadFileTool from "../tools/read_file";
import SaveAnalysisTool from "../tools/save_analysis";
import { ToolSchema } from "../tools/util";
import WriteFileTool from "../tools/write_file";

export interface CreateExplorerAgentOptions<T extends ToolSchema> {
  walker: RepositoryWalker;
  prompt: string;
  canWrite: boolean;
  objective?: {
    objectiveSchema: T;
    objectiveDescription: string;
    objectiveFunctionName?: string;
  };
  temperature?: number;
  modelName?: string;
}

/***
 * Create an agent to solve a specific agent
 */
export async function createExplorerAgentExecutor<T extends ToolSchema>({
  walker,
  prompt,
  canWrite,
  objective,
  temperature,
  modelName,
}: CreateExplorerAgentOptions<T>): Promise<AgentExecutor> {
  // Repository exploration tools
  const listFilesTool = new ListFilesTool(walker);
  const tools: StructuredTool[] = [listFilesTool, new ReadFileTool(walker)];
  if (canWrite) {
    // Add write capabilities
    tools.push(new WriteFileTool());
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
    SystemMessagePromptTemplate.fromTemplate(prompt),
    new MessagesPlaceholder("chat_history"),
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

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
  });
}
