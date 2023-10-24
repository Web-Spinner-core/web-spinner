import { ChatCompletionMessageParam } from "openai/resources";
import { openai } from "~/lib/openai";
import SelectActionTool from "./tools/select_action";
import { AnyTool } from "./tools/tool";

/**
 * Given a prior of messages, identify what action to perform next
 * This forces the model to select one of the provided functions
 */
export async function selectAction(
  messages: ChatCompletionMessageParam[],
  tools: [AnyTool, ...AnyTool[]]
) {
  const actions = tools.map((tool) => tool.name) as [string, ...string[]];
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

  const { action } = selectActionTool.parse(JSON.parse(argumentsRaw));
  return action;
}
