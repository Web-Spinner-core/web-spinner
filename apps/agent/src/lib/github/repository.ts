import { RestEndpointMethodTypes } from "@octokit/rest";
import { Repository } from "database";
import { Octokit } from "octokit";

type GitHubContentResponse =
  RestEndpointMethodTypes["repos"]["getContent"]["response"];

/**
 * Utility class that makes it easier to traverse a repository
 */
export class RepositoryWalker {
  constructor(
    private readonly client: Octokit,
    private readonly owner: string,
    private readonly repo: string
  ) {}

  /**
   * Get the contents of a directory
   */
  async getFiles(path: string): Promise<GitHubContentResponse["data"]> {
    const content = await this.client.rest.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path,
    });

    if (!Array.isArray(content.data)) {
      throw new Error("Attempted to get files for non-directory!");
    }
    return content.data;
  }
}
