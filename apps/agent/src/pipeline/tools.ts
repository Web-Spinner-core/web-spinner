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
      required: ["directory"],
    },
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
      required: ["path"],
    },
  },
};
