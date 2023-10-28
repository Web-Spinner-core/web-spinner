import { Repository } from "database";
import { getGithubInstallationClient } from "~/lib/github";
import { RepositoryWalker } from "~/lib/github/repository";
import { logger } from "~/lib/logger";
import { createExplorerAgentExecutor } from "./agents/explorer_agent";

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
  const [owner, repo] = repository.fullName.split("/");
  const walker = new RepositoryWalker(installationClient, owner, repo);

  const explorer = await createExplorerAgentExecutor(walker, prompt);
  const result = await explorer.call({
    input: "",
    chat_history: [],
  });

  logger.log("analyzeRepository", `Result: ${JSON.stringify(result)}`);
  return result;
}
