import { Repository } from "database";
import { getGithubInstallationClient } from "~/lib/github";
import { RepositoryWalker } from "~/lib/github/repository";
import ExplorerAgent from "./agents/explorer_agent";
import SaveAnalysisTool from "./tools/save_analysis";
import { logger } from "~/lib/logger";

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

  const saveAnalysisTool = new SaveAnalysisTool();
  const explorerAgent = new ExplorerAgent(
    saveAnalysisTool.parameters,
    walker,
    prompt
  );

  const result = await explorerAgent.execute();
  logger.log("analyzeRepository", `Result: ${JSON.stringify(result)}`);
  return result;
}
