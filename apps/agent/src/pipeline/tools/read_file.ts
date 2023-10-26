import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";
import { RepositoryWalker } from "~/lib/github/repository";

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
    const files = await this.repositoryWalker.readFile(path);
    return JSON.stringify(files);
  }
}
