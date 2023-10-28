import { ChatOpenAI } from "langchain/chat_models/openai";
import { env } from "~/env";

/**
 * OpenAI chat model
 */
export const chatOpenAi = new ChatOpenAI({
  openAIApiKey: env.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
});
