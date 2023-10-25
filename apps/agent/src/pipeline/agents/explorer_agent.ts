import { ChatCompletionMessageParam } from "openai/resources";
import { z } from "zod";
import { RepositoryWalker } from "~/lib/github/repository";
import ListFilesTool from "../tools/list_files";
import ReadFileTool from "../tools/read_file";
import SaveAnalysisTool from "../tools/save_analysis";
import {
  identifyToolAction,
  identifyToolArguments,
} from "./util/identify_tool";
import { serializeFunctionCall } from "./util/serialize";
import { logger } from "~/lib/logger";

const listFilesTool = new ListFilesTool();
const readFileTool = new ReadFileTool();
const directoryTools = [
  listFilesTool,
  readFileTool,
  new SaveAnalysisTool(),
] as const;

type DirectoryTool = (typeof directoryTools)[number];

interface FunctionCall<T extends DirectoryTool> {
  tool: T;
  arguments: z.infer<T["parameters"]>;
}

const PREFIX = "ExplorerAgent";

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
    const initFiles = await this.walker.getFiles(startPath);
    this.messages.push(
      ...serializeFunctionCall(listFilesTool, { directory: "" }, initFiles)
    );

    let { tool, arguments: args } = await this.think();
    while (tool.name !== "save_analysis") {
      if (tool.name === "list_files") {
        const { directory } = args as z.infer<ListFilesTool["parameters"]>;
        const files = await this.walker.getFiles(directory);
        this.messages.push(
          ...serializeFunctionCall(listFilesTool, { directory }, files)
        );
      } else if (tool.name === "read_file") {
        const { path } = args as z.infer<ReadFileTool["parameters"]>;
        const contents = await this.walker.readFile(path);
        this.messages.push(
          ...serializeFunctionCall(readFileTool, { path }, contents)
        );
      }

      // Re-evaluate
      ({ tool, arguments: args } = await this.think());
    }
    logger.log(
      PREFIX,
      `Analyzed repository with arguments ${JSON.stringify(args)}`
    );

    return args;
  }

  /**
   * Decide what action to take next
   */
  private async think(): Promise<FunctionCall<DirectoryTool>> {
    logger.log(PREFIX, `Messages: ${JSON.stringify(this.messages)}`);
    logger.log(PREFIX, "Thinking...");
    const action = await identifyToolAction(this.messages, directoryTools);
    const tool = directoryTools.find((tool) => tool.name === action);
    if (!tool) {
      throw new Error(`No tool found with name ${action}`);
    }
    const args = await identifyToolArguments(this.messages, tool);

    logger.log(
      PREFIX,
      `Selected ${tool.name} with arguments ${JSON.stringify(args)}`
    );
    return {
      tool,
      arguments: args,
    };
  }
}
