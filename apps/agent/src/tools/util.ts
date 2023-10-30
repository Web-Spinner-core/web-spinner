import { AIMessage, BaseMessage, FunctionMessage } from "langchain/schema";
import { StructuredTool } from "langchain/tools";
import { z } from "zod";

/**
 * Tool parameter schema
 */
export type ToolSchema = z.ZodObject<any, any, any, any, { [x: string]: any }>;

/**
 * Create a record from the provided object, labeled with the descriptions from the provided schema
 */
export function labelRecordWithSchema<T extends ToolSchema>(
  object: z.infer<T>,
  schema: T
) {
  const labeled = {} as Record<string, any>;
  const directoryKeys = Object.keys(schema.shape) as string[];
  for (const key of directoryKeys) {
    if (object[key] && typeof object[key] === "object") {
      labeled[key] = labelRecordWithSchema(object[key], schema.shape[key]);
    } else {
      labeled[key] = {
        value: object[key],
        description: schema.shape[key].description,
      };
    }
  }
  return labeled;
}

/**
 * Serialize a function call and its result into a pair of messages
 */
export function serializeFunctionCall(
  tool: StructuredTool,
  args: string,
  result: string
): [BaseMessage, BaseMessage] {
  return [
    new AIMessage({
      content: "",
      additional_kwargs: {
        function_call: {
          name: tool.name,
          arguments: args,
        },
      },
    }),
    new FunctionMessage({
      name: tool.name,
      content: result,
    }),
  ];
}
