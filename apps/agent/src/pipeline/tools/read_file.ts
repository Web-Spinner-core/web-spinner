import { z } from "zod";
import Tool from "./tool";

const parameterSchema = z.object({
  path: z.string().describe("The path of the file to read"),
});

export default class ReadFileTool extends Tool<typeof parameterSchema> {
  constructor() {
    super("read_file", "Read a file", parameterSchema);
  }
}
