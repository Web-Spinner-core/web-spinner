import { createChatModel } from "@lib/openai";
import { AgentExecutor, OpenAIAgent } from "langchain/agents";
import { Callbacks } from "langchain/callbacks";
import { LLMChain } from "langchain/chains";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import { BaseMessage } from "langchain/schema";
import { StructuredTool } from "langchain/tools";

interface CreateAgentOptions {
  systemPrompt: string;
  prior?: BaseMessage[];
  userPrompt?: string;
  reminderPrompt?: string;
  temperature?: number;
  modelName?: string;
  callbacks?: Callbacks;
  tools: StructuredTool[];
  returnIntermediateSteps?: boolean;
  shouldCache?: boolean;
}

/**
 * Create an agent executor from a set of tools
 */
export async function createAgentExecutor(args: CreateAgentOptions) {
  const {
    userPrompt,
    systemPrompt,
    prior = [],
    reminderPrompt,
    temperature,
    modelName,
    callbacks,
    tools,
    returnIntermediateSteps = false,
    shouldCache,
  } = args;

  // Prompt
  const promptTemplate = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemPrompt),
    HumanMessagePromptTemplate.fromTemplate(userPrompt ?? "{input}"),
    ...prior,
    new MessagesPlaceholder("chat_history"),
    ...(reminderPrompt
      ? [SystemMessagePromptTemplate.fromTemplate(reminderPrompt)]
      : []),
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const model = await createChatModel({
    modelName: modelName ?? "gpt-4-1106-preview",
    temperature: temperature ?? 0,
    callbacks,
    cache: shouldCache,
  });

  // Executors
  const chain = new LLMChain({
    prompt: promptTemplate,
    llm: model,
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
    returnIntermediateSteps,
  });
}
