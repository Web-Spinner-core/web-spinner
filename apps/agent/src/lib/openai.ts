import { Callbacks } from "langchain/callbacks";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { getCache } from "./cache";

export interface CreateChatModelParams {
  modelName: string;
  maxTokens?: number;
  temperature?: number;
  callbacks?: Callbacks;
  cache?: boolean;
}

/**
 * Create a chat model
 */
export async function createChatModel({
  modelName,
  maxTokens,
  temperature,
  callbacks,
  cache: shouldCache = true
}: CreateChatModelParams) {
  const cache = shouldCache ? await getCache() : undefined;

  return new ChatOpenAI({
    modelName,
    maxTokens,
    temperature,
    cache,
    callbacks
  });
}