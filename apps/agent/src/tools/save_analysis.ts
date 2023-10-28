import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";
import { ToolSchema } from "./util";

export default class SaveAnalysisTool<
  T extends ToolSchema,
> extends StructuredTool<T> {
  name = "save_analysis";
  description = "Save the analysis of a repository";

  // Initialize with placeholder schema to satisfy abstract implementation
  schema = z.object({
    placeholder: z.string().describe("Placeholder field"),
  }) as unknown as T;
  returnDirect = true;

  constructor(
    parameterSchema: T,
    description: string,
    toolParams?: ToolParams
  ) {
    super(toolParams);
    this.schema = parameterSchema;
    this.description = description;
  }

  async _call(args: z.input<this["schema"]>): Promise<string> {
    return JSON.stringify(args);
  }
}
