import { StructuredTool } from "langchain/tools";
import { z } from "zod";
import WriteFileTool from "./write_file";

const parameterSchema = z.object({
  name: z.string().describe("The name of the React component to create"),
  content: z.string().describe("The contents of the React file to write"),
});

export default class CreateComponentTool extends StructuredTool<
  typeof parameterSchema
> {
  name = "create_react_component";
  description = "Create a React component file.";
  schema = parameterSchema;

  constructor(private readonly fileWriter: WriteFileTool) {
    super();
  }

  async _call({ name, content }: z.input<this["schema"]>): Promise<string> {
    const path = `src/components/${name}.tsx`;
    await this.fileWriter.call({
      path,
      content,
    });
    return path;
  }
}