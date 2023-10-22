// Mapping of error codes to HTTP status codes
const errors = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

export type ErrorCode = keyof typeof errors;

interface APIErrorArgs {
  code: ErrorCode;
  message?: string;
}

/**
 * Generic API error
 */
export default class APIError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;

  constructor({ code, message }: APIErrorArgs) {
    super(message ?? code);
    this.code = code;
    this.statusCode = errors[code];
  }
}