import { Repository } from "database";
import { BaseMessage } from "langchain/schema";
import { RepositoryWalker } from "~/lib/github/repository";
import ListFilesTool from "~/tools/list_files";
import ReadFileTool from "~/tools/read_file";
import { serializeFunctionCall } from "~/tools/util";
import {
  getStarterMessages as getDirectoryStarterMessages,
  objectiveSchema as repositoryAnalysisSchema,
} from "../identify_directories";

export const systemPrompt = `You are an expert frontend web developer. You have already identified what directories you need to modify to \
create new pages, components, and styles. Now, you are ready to create a new page. Modularize the code where it makes sense, by creating components \
in the appropriate directories. Use existing components and styles where possible. Make sure to STYLE YOUR CODE!

If you need to create additional style files or utilities, you can call the provided tools multiple times.
You MUST ALWAYS use one of the provided tools to explore the repository, write to a file, or exit with a list of files that were written to.`;

export const userPrompt = `Create a page with the following description:
##########################
{input}
##########################`;

/**
 * Get a pair of messages related to the first file matching the specification
 */
async function getFirstFileMessages(
  walker: RepositoryWalker,
  parentPath: string,
  extension?: string
): Promise<BaseMessage[]> {
  const readFileTool = new ReadFileTool(walker);
  const file = await walker.getFirstFile(parentPath, extension);
  const path = file.path;
  const fileContent = await walker.readFile(path);

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
  repository: Repository
) {
  const directoryStarterMessages = await getDirectoryStarterMessages(walker);
  const { pages, components } = repositoryAnalysisSchema.parse(
    repository.directoryAnalysis
  );

  const listFilesTool = new ListFilesTool(walker);
  const pagesFiles = await walker.getFiles(pages);
  const componentsFiles = await walker.getFiles(components);

  const pagesFilesMessage = serializeFunctionCall(
    listFilesTool,
    JSON.stringify({ directory: pages }),
    JSON.stringify(pagesFiles)
  );
  const componentsFilesMessage = serializeFunctionCall(
    listFilesTool,
    JSON.stringify({ directory: components }),
    JSON.stringify(componentsFiles)
  );

  const pageSampleMessage = await getFirstFileMessages(
    walker,
    pages,
    "index.tsx"
  );
  const componentSampleMessage = await getFirstFileMessages(
    walker,
    components,
    "tsx"
  );
  const componentStyleMessage = await getFirstFileMessages(
    walker,
    components,
    "css"
  );

  return [
    ...directoryStarterMessages,
    ...pagesFilesMessage,
    ...pageSampleMessage,
    ...componentsFilesMessage,
    ...componentSampleMessage,
    ...componentStyleMessage,
  ];
}
