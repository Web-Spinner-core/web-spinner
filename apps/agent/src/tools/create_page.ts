import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";
import WriteFileTool from "./write_file";

const parameterSchema = z.object({
  http_path: z
    .string()
    .describe(
      'The path to the page to create. Use square brackets to indicate dynamic segments, e.g. "/users/[id]"'
    ),
  layout_content: z
    .string()
    .describe(
      "The contents of the layout file to write. Make sure to specify in the code if you are using a client or server component."
    ),
  page_content: z
    .string()
    .describe(
      "The contents of the page file to write. Make sure to specify in the code if you are using a client or server component."
    ),
});

export default class CreatePageTool extends StructuredTool<
  typeof parameterSchema
> {
  name = "create_page";
  description = "Create a new page using Next.js App Router";
  schema = parameterSchema;

  constructor(
    private readonly fileWriter: WriteFileTool,
    private readonly toolParams?: ToolParams
  ) {
    super(toolParams);
  }

  async _call({
    http_path,
    layout_content,
    page_content,
  }: z.input<this["schema"]>): Promise<string> {
    const basePath = `src/app${http_path}`;
    const layoutPath = `${basePath}/layout.tsx`;
    const pagePath = `${basePath}/page.tsx`;
    await Promise.all([
      this.fileWriter.writeFile({
        path: layoutPath,
        content: layout_content,
      }),
      this.fileWriter.writeFile({
        path: pagePath,
        content: page_content,
      }),
    ]);
    return JSON.stringify({ layoutPath, pagePath }, null, 2);
  }
}
