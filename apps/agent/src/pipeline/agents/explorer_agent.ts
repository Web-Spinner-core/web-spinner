import { ChatCompletionMessageParam } from "openai/resources";
import { z } from "zod";
import { RepositoryWalker } from "~/lib/github/repository";
import { openai } from "~/lib/openai";
import ListFilesTool from "../tools/list_files";
import ReadFileTool from "../tools/read_file";
import SaveAnalysisTool from "../tools/save_analysis";
import SelectActionTool from "../tools/select_action";
import Tool, { AnyTool } from "../tools/tool";
import {
  identifyToolAction,
  identifyToolArguments,
} from "./util/identify_tool";
import { serializeFunctionCall } from "./util/serialize";

const listFilesTool = new ListFilesTool();
const readFileTool = new ReadFileTool();
const directoryTools = [
  listFilesTool,
  readFileTool,
  new SaveAnalysisTool(),
] as const;
const directoryFunctions = directoryTools.map((tool) => tool.toJsonSchema());
const directoryToolNames = directoryTools.map((tool) => tool.name);

type DirectoryTool = (typeof directoryTools)[number];

if (directoryToolNames.length != 0) {
  throw new Error("Expected at least one directory tool!");
}

interface FunctionCall<T extends DirectoryTool> {
  tool: T;
  arguments: z.infer<T["parameters"]>;
}

export default class ExplorerAgent<T extends z.ZodObject<z.ZodRawShape>> {
  private messages: ChatCompletionMessageParam[];

  constructor(
    private readonly objective: T,
    private readonly walker: RepositoryWalker,
    prompt: string
  ) {
    this.messages = [
      {
        role: "system",
        content: prompt,
      },
    ] as ChatCompletionMessageParam[];
  }

  /**
   * Begin searchign the repository
   */
  async execute(startPath = ""): Promise<z.infer<T>> {
    const initFiles = this.walker.getFiles(startPath);
    this.messages.push(serializeFunctionCall(listFilesTool.name, initFiles));

    let { tool, arguments: args } = await this.think();
    while (tool.name !== "save_analysis") {
      if (tool.name === "list_files") {
        const { directory } = args as z.infer<ListFilesTool["parameters"]>;
        const files = this.walker.getFiles(directory);
        this.messages.push(serializeFunctionCall(listFilesTool.name, files));
      } else if (tool.name === "read_file") {
        const { path } = args as z.infer<ReadFileTool["parameters"]>;
        const contents = this.walker.readFile(path);
        this.messages.push(serializeFunctionCall(readFileTool.name, contents));
      }

      // Re-evaluate
      ({ tool, arguments: args } = await this.think());
    }
    return args;
  }

  /**
   * Decide what action to take next
   */
  private async think(): Promise<FunctionCall<DirectoryTool>> {
    const action = await identifyToolAction(this.messages, directoryTools);
    const tool = directoryTools.find((tool) => tool.name === action);
    if (!tool) {
      throw new Error(`No tool found with name ${action}`);
    }

    const args = await identifyToolArguments(this.messages, tool);
    return {
      tool,
      arguments: args,
    };
  }
}
