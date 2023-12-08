import { getGithubInstallationClient } from "@lib/github";
import { RepositoryWalker } from "@lib/github/repository";
import { Page, Project, Repository } from "database";
import { z } from "zod";
import { FileWrite } from "~/tools/write_file";
import { getStarterMessages } from "./messages";

export const objectiveSchema = z.object({
  files: z
    .string()
    .array()
    .describe("The paths to the files that were created"),
});

const objectiveFunctionName = "record_files";
const objectiveDescription = "Record the new files that were created";

type PopulatedPage = Page & {
  project: Project & {
    repository: Repository;
  };
};

/**
 * Create a diff for multi-file changes from a standalone
 */
export async function createMultiFromStandalonePage(
  page: PopulatedPage,
) {
  const repository = page.project.repository;
  const installationClient = getGithubInstallationClient(
    repository.installationId
  );
  const [owner, repo] = repository.fullName.split("/");
  const walker = new RepositoryWalker(installationClient, owner, repo);

  const fileWrites: FileWrite[] = [];
  const accumulator = (file: FileWrite) => {
    fileWrites.push(file);
  };

  const starterMessages = await getStarterMessages(walker);

  return result;
}
