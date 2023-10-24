import { z } from "zod";
import Tool from "./tool";

const name = "list_files";
const description = "List files in a directory";
const parameterSchema = z.object({
  directory: z.string().describe("The directory to list files in"),
});

export default class ListFilesTool extends Tool<
  typeof name,
  typeof description,
  typeof parameterSchema
> {
  constructor() {
    super(name, description, parameterSchema);
  }
}
