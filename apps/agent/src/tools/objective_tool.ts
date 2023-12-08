import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";
import { ToolSchema } from "./util";

/**
 * A tool that can be used to save the result of an arbitrary objective
 */
export default class ObjectiveTool<
  T extends ToolSchema,
> extends StructuredTool<T> {
  name = "save_objective";
  description = "Save the result of an arbitrary objective";

  // Initialize with placeholder schema to satisfy abstract implementation
  schema = z.object({
    placeholder: z.string().describe("Placeholder field"),
  }) as unknown as T;
  returnDirect = true;

  constructor(
    parameterSchema: T,
    description: string,
    name?: string,
    toolParams?: ToolParams
  ) {
    super(toolParams);
    this.schema = parameterSchema;
    this.description = description;
    if (name) {
      this.name = name;
    }
  }

  async _call(args: z.input<this["schema"]>): Promise<string> {
    return JSON.stringify(args);
  }
}
