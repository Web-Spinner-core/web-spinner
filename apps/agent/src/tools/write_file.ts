import { writeFileSync } from "fs";
import { StructuredTool, ToolParams } from "langchain/tools";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { serializeToolError } from "~/lib/error";

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

  constructor(toolParams?: ToolParams) {
    super(toolParams);
  }

  async _call({ path, content }: z.input<this["schema"]>): Promise<string> {
    let result: any;
    try {
      const id = uuid();
      writeFileSync(`../tmp/${id}.txt`, `Path: ${path}\n\n\n${content}`);
      result = {
        success: true,
      };
    } catch (err) {
      result = serializeToolError(err);
    }
    return JSON.stringify(result);
  }
}
