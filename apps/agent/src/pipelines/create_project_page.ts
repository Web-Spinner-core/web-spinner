import { Repository } from "database";
import { getGithubInstallationClient } from "~/lib/github";
import { RepositoryWalker } from "~/lib/github/repository";
import { createExplorerAgentExecutor } from "../agents/explorer_agent";
import {
  getStarterMessages as getThemeStarterMessages,
  objectiveSchema as identifyThemeSchema,
} from "./identify_theme";
import { labelRecordWithSchema } from "~/tools/util";
import { AIMessage, FunctionMessage } from "langchain/schema";
import { z } from "zod";

const prompt = `You are an expert frontend web developer. You have already identified what directories you need to modify to \
create new pages, components, and styles. You have also identified the theme and design language of the project. \
Now, you are ready to create a new page. Modularize the code where it makes sense, by creating components \
in the appropriate directories. Use existing components and styles where possible. If you need to create additional style files or utilities, \
make sure to write them as well.

You must always use one of the provided functions to explore the repository, write to a file, or exit with a list of files that were written to.
#################
You must now create a page with the following description:
{input}`;

export const objectiveSchema = z.object({
  files: z
    .object({
      path: z.string().describe("The path to the file"),
    })
    .array(),
});

const objectiveFunctionName = "record_files";
const objectiveDescription = "Record the new files that were created";

/**
 * Get starter messages containing the directory and theme analyses
 */
export async function getStarterMessages(
  walker: RepositoryWalker,
  repository: Repository
) {
  const themeStarterMessages = await getThemeStarterMessages(
    walker,
    repository
  );

  const themeAnalysis = identifyThemeSchema.parse(repository.themeAnalysis);
  const labeledThemeAnalysis = labelRecordWithSchema(
    themeAnalysis,
    identifyThemeSchema
  );

  return [
    ...themeStarterMessages,
    new AIMessage({
      content: "",
      additional_kwargs: {
        function_call: {
          name: "identify_theme",
          arguments: "",
        },
      },
    }),
    new FunctionMessage({
      name: "identify_theme",
      content: JSON.stringify(labeledThemeAnalysis),
    }),
  ];
}

/**
 * Create a page using the project's existing theme and design language
 */
export async function createProjectPage(
  repository: Repository,
  description: string
) {
  const installationClient = getGithubInstallationClient(
    repository.installationId
  );
  const [owner, repo] = repository.fullName.split("/");
  const walker = new RepositoryWalker(installationClient, owner, repo);

  const explorer = await createExplorerAgentExecutor({
    walker,
    prompt,
    canWrite: true,
    objective: {
      objectiveSchema,
      objectiveDescription,
      objectiveFunctionName,
    },
    temperature: 0.5,
    modelName: "gpt-4",
  });

  const starterMessages = await getStarterMessages(walker, repository);
  const result = await explorer.call({
    input: description,
    chat_history: starterMessages,
  });

  return result;
}
