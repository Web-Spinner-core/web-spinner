import { ChatCompletionMessageParam } from "openai/resources";
import { z } from "zod";
import { logger } from "~/lib/logger";
import { AnyTool } from "~/pipeline/tools/tool";

/**
 * Return a serialized version of a function call and its corresponding result
 */
export function serializeFunctionCall<T extends AnyTool>(
  tool: T,
  args: z.infer<T["parameters"]>,
  result: z.infer<T["resultSchema"]>
): ChatCompletionMessageParam[] {
  const functionCall: ChatCompletionMessageParam = {
    role: "assistant",
    function_call: {
      name: tool.name,
      arguments: JSON.stringify(args),
    },
    content: "",
  };
  const functionResult: ChatCompletionMessageParam = {
    role: "function",
    name: tool.name,
    content: JSON.stringify(result),
  };
  const serialized = [functionCall, functionResult];
  logger.log("ExplorerAgent", `Function call: ${JSON.stringify(functionCall)}`);
  logger.log(
    "ExplorerAgent",
    `Function result: ${JSON.stringify(functionResult)}`
  );
  return serialized;
}
