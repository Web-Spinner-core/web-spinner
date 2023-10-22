// Mapping of error codes to HTTP status codes
const errorCodes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

export type ErrorType = keyof typeof errorCodes;

interface APIErrorArgs {
  type: ErrorType;
  message?: string;
}

/**
 * Generic API error
 */
export default class APIError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;

  constructor({ type, message }: APIErrorArgs) {
    super(message ?? type);
    this.type = type;
    this.statusCode = errorCodes[type];
  }
}