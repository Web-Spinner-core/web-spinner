import { ChatCompletionMessageParam } from "openai/resources";
import { z } from "zod";
import { openai } from "~/lib/openai";
import SelectActionTool from "~/pipeline/tools/select_action";
import { AnyTool } from "~/pipeline/tools/tool";

/**
 * Given a prior of messages, identify what action to perform next
 * This forces the model to select one of the provided functions
 */
export async function identifyToolAction<
  T extends readonly [AnyTool, ...AnyTool[]],
>(
  messages: ChatCompletionMessageParam[],
  tools: T
): Promise<T[number]["name"]> {
  // Get names of tools, retaining literal types
  const actions = tools.map((tool) => tool.name) as [
    T[number]["name"],
    ...T[number]["name"][],
  ];
  const selectActionTool = new SelectActionTool(actions);

  const toolSchemas = tools
    .concat(selectActionTool)
    .map((tool) => tool.toJsonSchema());

  const selectActionResponse = await openai.chat.completions.create({
    messages,
    model: "gpt-3.5-turbo",
    functions: toolSchemas,
    function_call: {
      name: selectActionTool.name,
    },
  });

  const argumentsRaw =
    selectActionResponse.choices[0].message.function_call?.arguments;
  if (!argumentsRaw) {
    throw new Error("No function call arguments provided!");
  }

  const { action } = selectActionTool.parseJson(argumentsRaw);
  return action!;
}

/**
 * Given a prior of messages, identify the arguments to pass to a tool
 * and return the parsed arguments
 */
export async function identifyToolArguments<T extends AnyTool>(
  messages: ChatCompletionMessageParam[],
  tool: T
): Promise<z.infer<T["parameters"]>> {
  const toolSchema = tool.toJsonSchema();
  const response = await openai.chat.completions.create({
    messages,
    model: "gpt-3.5-turbo",
    functions: [toolSchema],
    function_call: {
      name: tool.name,
    },
  });

  const argumentsRaw = response.choices[0].message.function_call?.arguments;
  if (!argumentsRaw) {
    throw new Error("No function call arguments provided!");
  }

  return tool.parse(JSON.parse(argumentsRaw)).arguments;
}
