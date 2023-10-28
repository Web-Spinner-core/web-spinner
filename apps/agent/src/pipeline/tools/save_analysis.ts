import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";

export const parameterSchema = z.object({
  pages: z
    .string()
    .describe("The path to the directory where new pages are created"),
  components: z
    .string()
    .describe("The path to the directory where new components are created"),
  utilities: z
    .string()
    .describe("The path to the directory where utilities are created"),
  styles: z
    .string()
    .optional()
    .describe("The path to the directory where new styles are created"),
});

export default class SaveAnalysisTool extends StructuredTool<
  typeof parameterSchema
> {
  name = "save_analysis";
  description = "Save the analysis of a repository";
  schema = parameterSchema;
  returnDirect = true;

  constructor(toolParams?: ToolParams) {
    super(toolParams);
  }

  async _call(args: z.input<this["schema"]>): Promise<string> {
    return JSON.stringify(args);
  }
}
