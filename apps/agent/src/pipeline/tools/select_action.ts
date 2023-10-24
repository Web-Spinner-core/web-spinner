import { z } from "zod";
import Tool from "./tool";

const name = "select_action";
const description = "Select an action to perform";

export default class SelectActionTool<
  T extends [string, ...string[]],
> extends Tool<
  typeof name,
  typeof description,
  z.ZodObject<{ action: z.ZodEnum<T> }>
> {
  constructor(actions: T) {
    const parameterSchema = z.object({
      action: z.enum(actions).describe("The action to perform"),
    });

    super(name, description, parameterSchema);
  }
}
