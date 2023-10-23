import OpenAI from "openai";
import { env } from "~/env";

/**
 * Authenticated client for interacting with the openai api
 */
export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});
