import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";

export interface FileWrite {
  path: string;
  content: string;
}

export type FileWriteAccumulator = (file: FileWrite) => void;

const parameterSchema = z.object({
  path: z.string().describe("The path of the file to create and/or update"),
  content: z.string().describe("The content of the file"),
});

export default class WriteFileTool extends StructuredTool<
  typeof parameterSchema
> {
  name = "write_file";
  description = "Write to a file. This will overwrite the file if it exists.";
  schema = parameterSchema;

  constructor(
    private readonly accumulator: FileWriteAccumulator,
    toolParams?: ToolParams
  ) {
    super(toolParams);
  }

  async _call({ path, content }: z.input<this["schema"]>): Promise<string> {
    // Call accumulator
    this.accumulator({ path, content });
    return JSON.stringify({
      success: true,
    });
  }
}
