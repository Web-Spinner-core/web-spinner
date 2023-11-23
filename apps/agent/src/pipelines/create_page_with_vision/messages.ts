import { Repository } from "database";
import { BaseMessage, FunctionMessage } from "langchain/schema";
import { RepositoryWalker } from "~/lib/github/repository";
import ListFilesTool from "~/tools/list_files";
import ReadFileTool from "~/tools/read_file";
import { serializeFunctionCall } from "~/tools/util";
import {
  getStarterMessages as getRootDirectoryMessages,
  objectiveSchema as repositoryAnalysisSchema,
} from "../identify_directories";
import { Callbacks } from "langchain/callbacks";

export const systemPrompt = `You are an expert frontend web developer.
You have already identified what directories you need to modify to create new pages, components, and styles.
You are reviewing an attempt to create a new page for a website.

The first attempt was a standalone page made using React and Tailwind, but it was not very good.
While its layout generally matches the request, it does not match the theme and design language of the project. 
Moreover, the code in this first attempt may not even match the code in the rest of the project.
Use this as a starting point to create a new page that matches the theme and code in the rest of the repository.

Modularize the code where it makes sense, by creating components in the appropriate directories. 
Use existing components and styles where possible and fill in as much detail as you can, avoiding large placeholders.
Minimize exploring the repository unless you really need more information to complete the task.
If you need to create or write to a file, you MUST use the write_file tool.
Answer ONLY using the provided tools to write to a file, explore the repository, or exit with a list of files that were written to.`;

export const reminderPrompt = `REMEMBER: you MUST ALWAYS only answer using the provided tools to explore the repository, write to a file, or exit with a list of files that were written to.`

export const userPrompt = `{input}`;

async function serializeListFiles(
  walker: RepositoryWalker,
  path: string,
  callbacks?: Callbacks
): Promise<BaseMessage[]> {
  const listFilesTool = new ListFilesTool(walker, { callbacks });
  const files = await walker.getFiles(path);

  return serializeFunctionCall(
    listFilesTool,
    JSON.stringify({ directory: path }),
    JSON.stringify(files)
  );
}

/**
 * Get a pair of messages related to the first file matching the specification
 */
async function serializeFileRead(
  walker: RepositoryWalker,
  parentPath: string,
  matchers: string[],
  callbacks?: Callbacks
): Promise<BaseMessage[]> {
  const readFileTool = new ReadFileTool(walker, { callbacks });
  const file = await walker.getFirstFile(parentPath, matchers);
  const path = file.path;
  const fileContent = await readFileTool.call({ path }, { callbacks });

  const sampleMessage = serializeFunctionCall(
    readFileTool,
    JSON.stringify({ path }),
    fileContent
  );

  return sampleMessage;
}

/**
 * Get the start messages for the create project page pipeline
 */
export async function getStarterMessages(
  walker: RepositoryWalker,
  repository: Repository,
  renderedTemplate: string,
  callbacks?: Callbacks
): Promise<BaseMessage[]> {
  const renderedTemplateMessage = new FunctionMessage({
    name: "viewDraft",
    content: renderedTemplate,
  });

  const directoryStarterMessages = await getRootDirectoryMessages(
    walker,
    callbacks
  );
  const { pages, components } = repositoryAnalysisSchema.parse(
    repository.directoryAnalysis
  );

  const dirs = [pages, components];
  const files = [
    {
      // eslint config
      path: "",
      matchers: [".eslintrc.js", ".eslintrc.cjs", ".eslintrc.json"],
    },
    {
      path: components,
      matchers: ["tsx"],
    },
  ];

  const directoryMessages = await Promise.all(
    dirs.map((dir) => serializeListFiles(walker, dir, callbacks))
  );
  const fileMessages = await Promise.all(
    files.map(({ path, matchers }) =>
      serializeFileRead(walker, path, matchers, callbacks)
    )
  );

  return [
    renderedTemplateMessage,
    directoryStarterMessages,
    directoryMessages,
    fileMessages,
  ].flat(2);
}
