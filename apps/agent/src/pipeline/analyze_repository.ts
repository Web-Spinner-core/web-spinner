import { RestEndpointMethodTypes } from "@octokit/rest";
import { Repository } from "database";
import { Octokit } from "octokit";
import { ChatCompletionMessageParam } from "openai/resources";
import { getGithubInstallationClient } from "~/lib/github";
import { openai } from "~/lib/openai";
import { selectAction } from "./select_action";
import { DIRECTORY_FUNCTIONS } from "./tools";

type GitHubContentResponse =
  RestEndpointMethodTypes["repos"]["getContent"]["response"];

interface SerializedDirectory {
  path: string;
  files: {
    name: string;
    type: "file" | "dir" | "submodule" | "symlink";
  }[];
}

const prompt = `You are an expert frontend web developer. You are analyzing the directory structure of a new repository that uses React and Next.js.
You need to identify four important directories in the repository:
1) Where new pages are created
2) Where new components are created
3) Where new styles are created (if separate)
4) Where utilities are created

Always call one of the provided functions to either submit your analysis or request more information.`;

/**
 * Identify important parts of the repository
 */
export async function analyzeRepository(repository: Repository) {
  const installationClient = getGithubInstallationClient(
    repository.installationId
  );

  await analyzeDirectory(installationClient, repository, "");
}

/**
 * Analyze a directory and identify the next step to proceed
 */
async function analyzeDirectory(
  client: Octokit,
  repository: Repository,
  directory: string
) {
  const [owner, repo] = repository.fullName.split("/");
  const content = await client.rest.repos.getContent({
    owner,
    repo,
    path: directory,
  });
  const files = serializeDirectory(directory, content.data);
  const messages = [
    {
      role: "system",
      content: prompt,
    },
    {
      role: "function",
      name: "list_files",
      content: JSON.stringify(files),
    },
  ] as ChatCompletionMessageParam[];
  const action = await selectAction(messages, DIRECTORY_FUNCTIONS);

  const response = await openai.chat.completions.create({
    messages,
    model: "gpt-3.5-turbo",
    functions: DIRECTORY_FUNCTIONS,
    function_call: {
      name: action,
    },
  });
  console.log(response.choices[0].message);
}

/**
 * Serialize a directory into an object containing its base path and all its direct children
 */
function serializeDirectory(
  basePath: string,
  data: GitHubContentResponse["data"]
): SerializedDirectory {
  if (!Array.isArray(data)) {
    throw new Error("Attempted to serialize non-directory file!");
  }
  return {
    path: basePath,
    files: data.map((item) => ({
      name: item.name,
      type: item.type,
    })),
  };
}
