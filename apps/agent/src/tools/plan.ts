import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";
import { ToolSchema } from "./util";

export default class PlanTool<
  T extends ToolSchema,
> extends StructuredTool<T> {
  name = "plan";
  description = "Declare a plan";

  // Initialize with placeholder schema to satisfy abstract implementation
  schema = z.object({
    placeholder: z.string().array().describe("Placeholder string array"),
  }) as unknown as T;

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
