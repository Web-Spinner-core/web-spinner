import { ChatCompletionMessageParam } from "openai/resources";
import { z } from "zod";
import { AnyTool } from "~/pipeline/tools/tool";

export function serializeFunctionCall<T extends AnyTool>(
  name: T["name"],
  result: z.infer<T["resultSchema"]>
): ChatCompletionMessageParam {
  return {
    role: "function",
    name,
    content: result,
  };
}
