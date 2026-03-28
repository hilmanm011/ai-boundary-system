export class NotFoundError extends Error {
  statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class LLMError extends Error {
  statusCode = 502;

  constructor(message: string) {
    super(message);
    this.name = "LLMError";
  }
}

export interface ErrorResponse {
  error: string;
  details?: unknown;
}

export type AuditAction = "created" | "approved" | "rejected";
