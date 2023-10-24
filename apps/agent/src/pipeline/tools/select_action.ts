import { z } from "zod";
import Tool from "./tool";

export default class SelectActionTool extends Tool<
  z.ZodObject<{ action: z.ZodEnum<[string, ...string[]]> }>
> {
  constructor(actions: readonly [string, ...string[]]) {
    const parameterSchema = z.object({
      action: z.enum(actions).describe("The action to perform"),
    });

    super("select_action", "Select an action to perform", parameterSchema);
  }
}
