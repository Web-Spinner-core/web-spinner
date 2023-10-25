import { z } from "zod";
import Tool from "./tool";

const name = "list_files";
const description = "List files in a directory";
const parameterSchema = z.object({
  directory: z.string().describe("The directory to list files in"),
});
const resultSchema = z.object({
  path: z.string().describe("The path to the file"),
  files: z
    .object({
      name: z.string().describe("The name of the file"),
      type: z.string().describe("The type of the file"),
    })
    .array(),
});

export default class ListFilesTool extends Tool<
  typeof name,
  typeof description,
  typeof parameterSchema,
  typeof resultSchema
> {
  constructor() {
    super(name, description, parameterSchema, resultSchema);
  }
}
