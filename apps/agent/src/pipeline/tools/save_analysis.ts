import { z } from "zod";
import Tool from "./tool";

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

export default class SaveAnalysisTool extends Tool<typeof parameterSchema> {
  constructor() {
    super(
      "save_analysis",
      "Save the analysis of a repository",
      parameterSchema
    );
  }
}
