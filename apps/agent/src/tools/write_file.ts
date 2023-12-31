import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";
import { writeFileSync } from "fs";
import { createId } from "@paralleldrive/cuid2";

export interface FileWrite {
  path: string;
  content: string;
}

export type FileWriteAccumulator = (file: FileWrite) => void;

interface WriteFileToolParams extends ToolParams {
  debug?: boolean;
}

const DEBUG_DIR = "/home/user/web-spinner/tmp";

const parameterSchema = z.object({
  path: z.string().describe("The path of the file to write to"),
  content: z.string().describe("The content to write"),
});

export default class WriteFileTool extends StructuredTool<
  typeof parameterSchema
> {
  name = "write_file";
  description = "Write to a file.";
  schema = parameterSchema;

  constructor(
    private readonly accumulator: FileWriteAccumulator,
    private readonly toolParams?: WriteFileToolParams
  ) {
    super(toolParams);
  }

  writeFile({ path, content }: FileWrite) {
    this.accumulator({ path, content });
  }

  async _call({ path, content }: z.input<this["schema"]>): Promise<string> {
    if (this.toolParams?.debug) {
      // Dump to tmp directory
      const file = path.split("/").pop();
      const [base, ext] = file!.split(".");
      writeFileSync(`${DEBUG_DIR}/${base}-${createId()}.${ext}`, content);
    }

    // Call accumulator
    this.accumulator({ path, content });
    return JSON.stringify({
      success: true,
    });
  }
}
