import { Octokit } from "octokit";

export interface File {
  name: string;
  type: "file" | "dir" | "submodule" | "symlink";
  path?: string;
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
   * Get all files in a directory, recursively
   */
  async getAllFiles(path: string): Promise<string> {
    const entries = await this.getFiles(path);

    const files = entries.filter((entry) => entry.type === "file").map((entry) => `${path}/${entry.name}`);
    const dirs = entries.filter((entry) => entry.type === "dir");

    const subFiles = await Promise.all(
      dirs.map(async (dir) => {
        return this.getAllFiles(`${path}/${dir.name}`);
      })
    );

    return [...files, ...subFiles.flat()].join("\n");
  }

  /**
   * Finds the first file in a path, or throws an error if none are found
   * Optionally matches based on a file name suffix (extension)
   */
  async getFirstFile(
    path: string,
    matchers?: string[],
    antiMatchers?: string[]
  ): Promise<File & { type: "file"; path: string }> {
    const entries = await this.getFiles(path);

    const files = entries.filter((entry) => entry.type === "file");
    const file =
      matchers != null
        ? files.find((entry) =>
            matchers.some((matcher) => {
              // If specified, antimatchers must not be present
              if (antiMatchers) {
                return (
                  entry.name.endsWith(matcher) &&
                  antiMatchers.every((antiMatcher) => !entry.name.includes(antiMatcher))
                );
              }
              return entry.name.endsWith(matcher);
            })
          )
        : files[0];

    if (!file) {
      // Recurse into subdirectories
      const dirs = entries.filter((entry) => entry.type === "dir");
      if (dirs.length === 0) {
        throw new Error(
          `Error! Could not find file ${matchers} in directory ${path}`
        );
      } else {
        return this.getFirstFile(`${path}/${dirs[0].name}`, matchers);
      }
    }

    file.path = `${path}/${file.name}`;

    return file as File & { type: "file"; path: string };
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
        if (extension && !path.includes("index")) {
          // Suggest checking directory index file but prevent infinite loop
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
