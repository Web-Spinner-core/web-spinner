import {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
} from "openai/resources";
import { z } from "zod";
import { openai } from "~/lib/openai";

/**
 * Generate the OpenAI function for selecting an action
 */
function getSelectActionFunction(
  functions: ChatCompletionCreateParams.Function[]
): ChatCompletionCreateParams.Function {
  const functionNames = functions.map((f) => f.name);

  return {
    name: "select_action",
    description: "Select an action to perform",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "The action to perform",
          enum: functionNames,
        },
      },
      required: ["action"],
    },
  };
}

/**
 * Generate the zod schema for the select action function
 */
function getSelectActionSchema(
  functions: ChatCompletionCreateParams.Function[]
) {
  const functionNames = functions.map((f) => f.name);
  if (functionNames.length < 1) {
    throw new Error("Must provide at least one function!");
  }

  return z.object({
    action: z.enum(functionNames as [string, ...string[]]),
  });
}

/**
 * Given a prior of messages, identify what action to perform next
 * This forces the model to select one of the provided functions
 */
export async function selectAction(
  messages: ChatCompletionMessageParam[],
  functions: ChatCompletionCreateParams.Function[]
) {
  const selectActionFunction = getSelectActionFunction(functions);
  const selectActionSchema = getSelectActionSchema(functions);

  const selectActionResponse = await openai.chat.completions.create({
    messages,
    model: "gpt-3.5-turbo",
    functions: functions.concat([selectActionFunction]),
    function_call: {
      name: selectActionFunction.name,
    },
  });

  const argumentsRaw =
    selectActionResponse.choices[0].message.function_call?.arguments;
  if (!argumentsRaw) {
    throw new Error("No function call arguments provided!");
  }

  const { action } = selectActionSchema.parse(JSON.parse(argumentsRaw));
  return action;
}
