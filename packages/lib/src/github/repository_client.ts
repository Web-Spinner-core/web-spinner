import { createId } from "@paralleldrive/cuid2";
import { Repository } from "database";
import { Octokit } from "@octokit/rest";
import {
  extractHtmlImageUrls,
  extractMarkdownImageUrls,
} from "../util/extract_image_url";

interface GitHubFileBlob {
  path: string;
  blobSha: string;
}

export interface FileWrite {
  path: string;
  content: string;
}

/**
 * A client instantiated to work with a specific repository
 */
export default class GithubRepositoryClient {
  owner: string;
  repo: string;

  constructor(
    private readonly client: Octokit,
    repository: Repository
  ) {
    [this.owner, this.repo] = repository.fullName.split("/");
  }

  // TODO: Replace octokit request calls with typed methods

  /**
   * Create a blob on GitHub and return the SHA of the blob
   */
  async createBlob(content: string): Promise<string> {
    const { data } = await this.client.request(
      `POST /repos/{owner}/{repo}/git/blobs`,
      {
        owner: this.owner,
        repo: this.repo,
        content: content,
        encoding: "utf-8",
      }
    );
    const { sha } = data;
    return sha;
  }

  /**
   * Create a tree on GitHub with the specified files and return the SHA of the tree
   */
  private async createTree(
    baseTreeSha: string,
    files: GitHubFileBlob[]
  ): Promise<string> {
    const { data } = await this.client.request(
      `POST /repos/{owner}/{repo}/git/trees`,
      {
        owner: this.owner,
        repo: this.repo,
        base_tree: baseTreeSha,
        tree: files.map((file) => ({
          path: file.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: file.blobSha,
        })),
      }
    );
    return data.sha;
  }

  /**
   * Create a commit on GitHub and return the SHA of the commit
   */
  private async createCommit(
    tree: string,
    message: string,
    parentCommit: string
  ): Promise<string> {
    const { data } = await this.client.request(
      `POST /repos/{owner}/{repo}/git/commits`,
      {
        owner: this.owner,
        repo: this.repo,
        message,
        tree,
        parents: [parentCommit],
        author: {
          name: "Web Spinner Bot",
          email: "hello@web-spinner.ai",
          date: new Date().toISOString(),
        },
      }
    );
    return data.sha;
  }

  /**
   * Create a branch on GitHub
   */
  private async createBranch(
    branchName: string,
    commitSha: string
  ): Promise<void> {
    await this.client.request(`POST /repos/{owner}/{repo}/git/refs`, {
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${branchName}`,
      sha: commitSha,
    });
  }

  /**
   * Create a pull request on GitHub
   * Returns the number that uniquely identifies this pull request
   */
  private async createPullRequest(
    baseBranch: string,
    branchName: string,
    title: string,
    body: string
  ): Promise<number> {
    const response = await this.client.request(
      `POST /repos/{owner}/{repo}/pulls`,
      {
        owner: this.owner,
        repo: this.repo,
        head: branchName,
        base: baseBranch,
        title,
        body,
      }
    );
    return response.data.number;
  }

  /**
   * Get the SHA of the branch tree
   */
  private async getBranch(branch: string) {
    const { data } = await this.client.request(
      `GET /repos/{owner}/{repo}/branches/{branch}`,
      {
        owner: this.owner,
        repo: this.repo,
        branch,
      }
    );
    return data;
  }

  /**
   * Get all open issues in the repository
   */
  async getIssues() {
    const { data } = await this.client.request(
      `GET /repos/{owner}/{repo}/issues`,
      {
        owner: this.owner,
        repo: this.repo,
        state: "open",
      }
    );
    return data.filter((issue: any) => issue.pull_request === undefined);
  }

  /**
   * Render markdown to HTML
   */
  async renderMarkdown(markdown: string): Promise<string> {
    const { data } = await this.client.request(`POST /markdown`, {
      text: markdown,
      mode: "gfm",
      context: `${this.owner}/${this.repo}`,
    });
    return data;
  }

  /**
   * Get the URLs of all images in the specified issue body
   */
  async getIssueImageUrls(issueNumber: number): Promise<string[]> {
    const { data } = await this.client.request(
      `GET /repos/{owner}/{repo}/issues/{issue_number}`,
      {
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      }
    );
    const mdUrls = extractMarkdownImageUrls(data.body ?? "");
    const renderedUrls = await Promise.all(
      mdUrls.map((url) => this.renderMarkdown(`<img src="${url}">`))
    );
    const imageUrls = renderedUrls.flatMap(extractHtmlImageUrls);
    return imageUrls;
  }

  /**
   * Create a pull request on GitHub from the specified files
   * Returns the number that uniquely identifies this pull request
   */
  async createPullRequestFromFiles(
    baseBranch: string,
    files: FileWrite[],
    title: string,
    body: string
  ): Promise<number> {
    const branchName = `web-spinner-${createId()}`;
    const fileBlobs = await Promise.all(
      files.map(async (file) => ({
        path: file.path,
        blobSha: await this.createBlob(file.content),
      }))
    );
    const branch = await this.getBranch(baseBranch);
    const baseTreeSha = branch.commit.commit.tree.sha;
    const baseCommit = branch.commit.sha;

    const tree = await this.createTree(baseTreeSha, fileBlobs);
    const commit = await this.createCommit(tree, title, baseCommit);

    await this.createBranch(branchName, commit);
    return this.createPullRequest(baseBranch, branchName, title, body);
  }

  /**
   * Get the files changed in the specified pull request
   * @throws {Error} if the pull request does not have a test merge commit ready yet
   */
  async getPullRequestDiffs(pullRequestNumber: number) {
    // Get the SHA of the merge commit
    const { data } = await this.client.pulls.listFiles({
      owner: this.owner,
      repo: this.repo,
      pull_number: pullRequestNumber,
    });
    return data;
  }
}
