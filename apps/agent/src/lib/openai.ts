import { Callbacks } from "langchain/callbacks";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { getCache } from "./cache";

export interface CreateChatModelParams {
  modelName: string;
  maxTokens?: number;
  temperature?: number;
  callbacks?: Callbacks
}

/**
 * Create a chat model
 */
export async function createChatModel({
  modelName,
  maxTokens,
  temperature,
  callbacks
}: CreateChatModelParams) {
  const cache = await getCache();

  return new ChatOpenAI({
    modelName,
    maxTokens,
    temperature,
    cache,
    callbacks
  });
}