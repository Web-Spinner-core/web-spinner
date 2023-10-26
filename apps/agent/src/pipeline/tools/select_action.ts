import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";

export default class SelectActionTool<
  T extends [string, ...string[]],
> extends StructuredTool {
  name = "select_action";
  description = "Select an action to perform";
  schema = z.object({
    action: z.enum(["placeholder"]).describe("The action to perform"),
  });

  constructor(tools: T, toolParams?: ToolParams) {
    super(toolParams);
    // @ts-ignore: Need to override the schema at runtime to add the choices
    this.schema = z.object({
      action: z.enum(tools).describe("The action to perform"),
    });
  }

  async _call(args: z.input<this["schema"]>): Promise<string> {
    return JSON.stringify(args);
  }
}
