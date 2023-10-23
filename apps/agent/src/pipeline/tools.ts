/**
 * A collection of JSONSchema definitions for OpenAI function calling
 */

export const listFilesFunction = {
  name: "list_files",
  description: "List files in a directory",
  parameters: {
    type: "object",
    properties: {
      directory: {
        type: "string",
        description: "The directory to list files in",
      },
    },
    required: ["directory"],
  },
};

export const readFileFunction = {
  name: "read_file",
  description: "Read a file",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path of the file to read",
      },
    },
    required: ["path"],
  },
};

export const saveAnalysisFunction = {
  name: "save_analysis",
  description: "Save the analysis of a repository",
  parameters: {
    type: "object",
    properties: {
      pages: {
        type: "string",
        description: "The path to the directory where new pages are created",
      },
      components: {
        type: "string",
        description:
          "The path to the directory where new components are created",
      },
      styles: {
        type: "string",
        description: "The path to the directory where new styles are created",
      },
      utilities: {
        type: "string",
        description: "The path to the directory where utilities are created",
      },
    },
    required: ["pages", "components", "utilities"],
  },
};

/**
 * OpenAI functions that can be used to analyze and navigate through a repository and file system
 */
export const DIRECTORY_FUNCTIONS = [
  listFilesFunction,
  readFileFunction,
  saveAnalysisFunction,
];
