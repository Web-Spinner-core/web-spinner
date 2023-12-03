import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";
import { serializeToolError } from "@lib/model/tool_error";
import { RepositoryWalker } from "@lib/github/repository";

const parameterSchema = z.object({
  path: z.string().describe("The path to the directory to list files in"),
});

export default class ListFilesTool extends StructuredTool<
  typeof parameterSchema
> {
  name = "list_files";
  description = "List files in a directory";
  schema = parameterSchema;

  constructor(
    private readonly repositoryWalker: RepositoryWalker,
    toolParams?: ToolParams
  ) {
    super(toolParams);
  }

  async _call({ path }: z.input<this["schema"]>): Promise<string> {
    let cleanedDirectory = path.trim();
    if (cleanedDirectory.startsWith("/")) {
      cleanedDirectory = cleanedDirectory.slice(1);
    } else if (cleanedDirectory.startsWith("./")) {
      cleanedDirectory = cleanedDirectory.slice(2);
    }

    let result: any;
    try {
      result = await this.repositoryWalker.getFiles(cleanedDirectory);
    } catch (err) {
      result = serializeToolError(err);
    }
    return JSON.stringify(result);
  }
}
