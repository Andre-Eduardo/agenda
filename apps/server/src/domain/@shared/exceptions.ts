export interface ExceptionFormatter<T> {
  invalidInput(message: string, violations?: InputViolation[]): T;

  resourceNotFound(message: string, resource?: string): T;

  operationConflict(message: string): T;

  accessDenied(message: string, reason: AccessDeniedReason): T;

  unauthenticated(): T;
}

export type InputViolation = {
  field: string;
  reason: string;
};

export enum AccessDeniedReason {
  UNKNOWN_USER = "UNKNOWN_USER",
  BAD_CREDENTIALS = "BAD_CREDENTIALS",
  NOT_ALLOWED = "NOT_ALLOWED",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
}

// eslint-disable-next-line unicorn/custom-error-definition -- base class name intentionally without Error suffix
export abstract class ExceptionBase extends Error {
  public constructor(
    readonly message: string,
    readonly cause?: Error,
  ) {
    super(message, { cause });
    // eslint-disable-next-line unicorn/custom-error-definition -- name is set dynamically to subclass name
    this.name = new.target.name;
    Error.captureStackTrace(this, this.constructor);
  }

  abstract format<T>(formatter: ExceptionFormatter<T>): T;
}

export class InvalidInputException extends ExceptionBase {
  readonly violations?: InputViolation[];

  constructor(message: string, violations?: InputViolation[], cause?: Error) {
    super(message, cause);
    this.violations = violations;
  }

  format<T>(formatter: ExceptionFormatter<T>): T {
    return formatter.invalidInput(this.message, this.violations);
  }
}

export class ResourceNotFoundException extends ExceptionBase {
  readonly resource?: string;

  constructor(message: string, resource?: string, cause?: Error) {
    super(message, cause);
    this.resource = resource;
  }

  format<T>(formatter: ExceptionFormatter<T>): T {
    return formatter.resourceNotFound(this.message, this.resource);
  }
}

export class PreconditionException extends ExceptionBase {
  format<T>(formatter: ExceptionFormatter<T>): T {
    return formatter.operationConflict(this.message);
  }
}

export class AccessDeniedException extends ExceptionBase {
  readonly reason: AccessDeniedReason;

  constructor(message: string, reason: AccessDeniedReason, cause?: Error) {
    super(message, cause);
    this.reason = reason;
  }

  format<T>(formatter: ExceptionFormatter<T>): T {
    return formatter.accessDenied(this.message, this.reason);
  }
}

export class UnauthenticatedException extends ExceptionBase {
  format<T>(formatter: ExceptionFormatter<T>): T {
    return formatter.unauthenticated();
  }
}

// eslint-disable-next-line unicorn/custom-error-definition -- domain exception class, 'Error' suffix breaks existing API
export class DuplicateNameException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DuplicateNameException";
  }
}
