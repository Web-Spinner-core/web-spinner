import { Repository } from "database";
import { Octokit } from "octokit";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { FileWrite } from "~/tools/write_file";

interface GitHubFileBlob {
  path: string;
  blobSha: string;
}

const createBlobResponseSchema = z.object({
  url: z.string(),
  sha: z.string(),
});

const branchResponseSchema = z.object({
  commit: z.object({
    sha: z.string(),
    commit: z.object({
      tree: z.object({
        sha: z.string(),
      }),
    }),
  }),
});

const issueResponseSchema = z
  .object({
    id: z.number(),
    node_id: z.string(),
    title: z.string(),
    body: z.string(),
  })
  .array();

type GitHubBranch = z.infer<typeof branchResponseSchema>;

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
    const { sha } = createBlobResponseSchema.parse(data);
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
   */
  private async createPullRequest(
    baseBranch: string,
    branchName: string,
    title: string,
    body: string
  ): Promise<void> {
    await this.client.request(`POST /repos/{owner}/{repo}/pulls`, {
      owner: this.owner,
      repo: this.repo,
      head: branchName,
      base: baseBranch,
      title,
      body,
    });
  }

  /**
   * Get the SHA of the branch tree
   */
  private async getBranch(branch: string): Promise<GitHubBranch> {
    const { data } = await this.client.request(
      `GET /repos/{owner}/{repo}/branches/{branch}`,
      {
        owner: this.owner,
        repo: this.repo,
        branch,
      }
    );
    return branchResponseSchema.parse(data);
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
    return issueResponseSchema.parse(data);
  }

  /**
   * Create a pull request on GitHub from the specified files
   */
  async createPullRequestFromFiles(
    baseBranch: string,
    files: FileWrite[],
    title: string,
    body: string
  ) {
    const branchName = `web-spinner-${uuid()}`;
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
    await this.createPullRequest(baseBranch, branchName, title, body);
  }
}
