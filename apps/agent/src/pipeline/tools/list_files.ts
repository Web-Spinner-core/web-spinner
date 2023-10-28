import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";
import { RepositoryWalker } from "~/lib/github/repository";

const parameterSchema = z.object({
  directory: z.string().describe("The directory to list files in"),
});

export class ListFilesTool extends StructuredTool<typeof parameterSchema> {
  name = "list_files";
  description = "List files in a directory";
  schema = parameterSchema;

  constructor(
    private readonly repositoryWalker: RepositoryWalker,
    toolParams?: ToolParams
  ) {
    super(toolParams);
  }

  async _call({ directory }: z.input<this["schema"]>): Promise<string> {
    let cleanedDirectory = directory.trim();
    if (cleanedDirectory.startsWith("/")) {
      cleanedDirectory = cleanedDirectory.slice(1);
    } else if (cleanedDirectory.startsWith("./")) {
      cleanedDirectory = cleanedDirectory.slice(2);
    }
    const files = await this.repositoryWalker.getFiles(cleanedDirectory);
    return JSON.stringify(files);
  }
}
