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
Now, you are ready to create a new page.

A first attempt at a standalone page was made using React and Tailwind, but it was not very good.
While its layout generally matches the request, it does not match the theme and design language. 
Moreover, the code in this first attempt may not even match the code in the rest of the project.
Use this as a starting point to create a new page that matches the theme and code in the rest of the repository.

Modularize the code where it makes sense, by creating components in the appropriate directories. 
Use existing components and styles where possible. Make sure to STYLE YOUR CODE!
Fill in as much detail as possible, avoiding large placeholders.
If you need to create additional style files or utilities, you can call the provided tools multiple times.
You MUST ALWAYS use the provided tools.`;

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
    name: "renderTemplate",
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
