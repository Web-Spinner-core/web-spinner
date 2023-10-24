import { z } from "zod";
import Tool from "./tool";

const parameterSchema = z.object({
  directory: z.string().describe("The directory to list files in"),
});

export default class ListFilesTool extends Tool<typeof parameterSchema> {
  constructor() {
    super("list_files", "List files in a directory", parameterSchema);
  }
}
