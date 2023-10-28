import { Octokit } from "octokit";

export interface File {
  name: string;
  type: "file" | "dir" | "submodule" | "symlink";
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
  async getFiles(path: string): Promise<File[]> {
    try {
      const content = await this.client.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      if (!Array.isArray(content.data)) {
        throw new Error(
          `Error! Attempted to get files for non-directory ${path}`
        );
      }

      return content.data.map((file) => ({
        name: file.name,
        type: file.type,
      }));
    } catch (err) {
      throw new Error(`Error! Could not get files for directory ${path}`);
    }
  }

  /**
   * Read the contents of a file
   */
  async readFile(path: string): Promise<string> {
    try {
      const content = await this.client.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      if (Array.isArray(content.data)) {
        throw new Error(`Error! Attempted to read directory ${path} as file`);
      }
      if (content.data.type !== "file") {
        throw new Error("Attempted to read non-file!");
      }

      return Buffer.from(content.data.content, "base64").toString();
    } catch (err) {
      if ((err as Error)?.message === "Not Found") {
        const extensions = [
          ".tsx",
          ".ts",
          ".jsx",
          ".js",
          ".module.css",
          ".module.scss",
        ];
        const extension = extensions.find((ext) => path.endsWith(ext));
        if (extension) {
          // Suggest checking directory index file
          const suggestion = path.replace(extension, `/index${extension}`);
          throw new Error(
            `Error! Could not find file ${path}. Did you mean "${suggestion}"?`
          );
        } else {
          throw new Error(`Error! Could not find file ${path}.`);
        }
      }
      throw err;
    }
  }
}
