import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";
import { serializeToolError } from "@lib/model/tool_error";
import { RepositoryWalker } from "@lib/github/repository";

const parameterSchema = z.object({
  path: z.string().describe("The path of the file to read"),
});

export default class ReadFileTool extends StructuredTool<
  typeof parameterSchema
> {
  name = "read_file";
  description = "Read a file";
  schema = parameterSchema;

  constructor(
    private readonly repositoryWalker: RepositoryWalker,
    toolParams?: ToolParams
  ) {
    super(toolParams);
  }

  async _call({ path }: z.input<this["schema"]>): Promise<string> {
    let result: any;
    try {
      result = await this.repositoryWalker.readFile(path);
    } catch (err) {
      result = serializeToolError(err);
    }
    return JSON.stringify(result);
  }
}
