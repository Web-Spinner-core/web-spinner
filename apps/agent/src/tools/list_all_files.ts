import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";
import { serializeToolError } from "@lib/model/tool_error";
import { RepositoryWalker } from "@lib/github/repository";

const parameterSchema = z.object({});

export default class ListAllFilesTool extends StructuredTool {
  name = "list_all_files";
  description = "List all the source files in the project";
  schema = parameterSchema;

  constructor(
    private readonly repositoryWalker: RepositoryWalker,
    toolParams?: ToolParams
  ) {
    super(toolParams);
  }

  async _call(): Promise<string> {
    let result: any;
    try {
      result = await this.repositoryWalker.getAllFiles("");
    } catch (err) {
      result = serializeToolError(err);
    }
    return JSON.stringify(result);
  }
}
