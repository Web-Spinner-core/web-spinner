import { Octokit } from "octokit";

export interface File {
  name: string;
  type: "file" | "dir" | "submodule" | "symlink";
}

export interface SerializedDirectory {
  path: string;
  files: File[];
}

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
  async getFiles(path: string): Promise<SerializedDirectory> {
    try {
      const content = await this.client.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      if (!Array.isArray(content.data)) {
        throw new Error("Attempted to get files for non-directory!");
      }

      const serializedDirectory = {
        path,
        files: content.data.map((file) => ({
          name: file.name,
          type: file.type,
        })),
      };
      return serializedDirectory;
    } catch (err) {
      throw new Error(`Error listing files for path ${path}`);
    }
  }

  /**
   * Read the contents of a file
   */
  async readFile(path: string): Promise<string> {
    const content = await this.client.rest.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path,
    });

    if (Array.isArray(content.data)) {
      throw new Error("Attempted to read directory!");
    }
    if (content.data.type !== "file") {
      throw new Error("Attempted to read non-file!");
    }

    return Buffer.from(content.data.content, "base64").toString();
  }
}
