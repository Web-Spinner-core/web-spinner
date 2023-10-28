/**
 * An error related to a tool execution
 */
export interface ToolError {
  error: string;
}

/**
 * Serialize an unknown error into a ToolError
 */
export function serializeToolError(err: unknown): ToolError {
  const errorMessage = err instanceof Error ? err.message : "An error occured";
  return {
    error: errorMessage,
  };
}
