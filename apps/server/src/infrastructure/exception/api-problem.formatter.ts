import {HttpStatus, Injectable, Scope} from '@nestjs/common';
import {ApiProblem, PROBLEM_URI, UnexpectedErrorFormatter} from '../../application/@shared/exception';
import {AccessDeniedReason, ExceptionFormatter, InputViolation} from '../../domain/@shared/exceptions';

export enum ApiProblemType {
    UNEXPECTED_ERROR = PROBLEM_URI + HttpStatus.INTERNAL_SERVER_ERROR,
    INVALID_INPUT = PROBLEM_URI + HttpStatus.BAD_REQUEST,
    RESOURCE_NOT_FOUND = PROBLEM_URI + HttpStatus.NOT_FOUND,
    OPERATION_CONFLICT = PROBLEM_URI + HttpStatus.CONFLICT,
    ACCESS_DENIED = PROBLEM_URI + HttpStatus.FORBIDDEN,
    UNAUTHENTICATED = PROBLEM_URI + HttpStatus.UNAUTHORIZED,
}

const problemTitles: Record<ApiProblemType, string> = {
    [ApiProblemType.UNEXPECTED_ERROR]: 'Unexpected error',
    [ApiProblemType.INVALID_INPUT]: 'Invalid input',
    [ApiProblemType.RESOURCE_NOT_FOUND]: 'Resource not found',
    [ApiProblemType.OPERATION_CONFLICT]: 'Preconditions not met for the required operation',
    [ApiProblemType.ACCESS_DENIED]: 'Access denied',
    [ApiProblemType.UNAUTHENTICATED]: 'Authentication required',
};

type ProblemDetails = ApiProblem<ApiProblemType>;

type InvalidInputProblem = ProblemDetails & {
    type: ApiProblemType.INVALID_INPUT;
    violations?: InputViolation[];
};

type ResourceNotFoundProblem = ProblemDetails & {
    type: ApiProblemType.RESOURCE_NOT_FOUND;
    resource?: string;
};

type AccessDeniedProblem = ProblemDetails & {
    type: ApiProblemType.ACCESS_DENIED;
    reason: AccessDeniedReason;
};

/**
 * An exception formatter that formats exceptions as API problems.
 * @see https://www.rfc-editor.org/rfc/rfc9457
 */
@Injectable({scope: Scope.REQUEST})
export class ApiProblemFormatter
    implements ExceptionFormatter<ProblemDetails>, UnexpectedErrorFormatter<ProblemDetails>
{
    constructor(private readonly instance: string) {}

    unexpectedError(): ProblemDetails {
        return {
            title: problemTitles[ApiProblemType.UNEXPECTED_ERROR],
            type: ApiProblemType.UNEXPECTED_ERROR,
            detail: 'An unexpected error occurred.',
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            instance: this.instance,
        };
    }

    invalidInput(message: string, violations?: InputViolation[]): InvalidInputProblem {
        return {
            title: problemTitles[ApiProblemType.INVALID_INPUT],
            type: ApiProblemType.INVALID_INPUT,
            detail: message,
            violations,
            status: HttpStatus.BAD_REQUEST,
            instance: this.instance,
        };
    }

    resourceNotFound(message: string, resource?: string): ResourceNotFoundProblem {
        return {
            title: problemTitles[ApiProblemType.RESOURCE_NOT_FOUND],
            type: ApiProblemType.RESOURCE_NOT_FOUND,
            detail: message,
            resource,
            status: HttpStatus.NOT_FOUND,
            instance: this.instance,
        };
    }

    operationConflict(message: string): ProblemDetails {
        return {
            title: problemTitles[ApiProblemType.OPERATION_CONFLICT],
            type: ApiProblemType.OPERATION_CONFLICT,
            detail: message,
            status: HttpStatus.CONFLICT,
            instance: this.instance,
        };
    }

    accessDenied(message: string, reason: AccessDeniedReason): AccessDeniedProblem {
        return {
            title: problemTitles[ApiProblemType.ACCESS_DENIED],
            type: ApiProblemType.ACCESS_DENIED,
            detail: message,
            reason,
            status: HttpStatus.FORBIDDEN,
            instance: this.instance,
        };
    }

    unauthenticated(): ProblemDetails {
        return {
            title: problemTitles[ApiProblemType.UNAUTHENTICATED],
            type: ApiProblemType.UNAUTHENTICATED,
            detail: 'Authentication is required to access this resource.',
            status: HttpStatus.UNAUTHORIZED,
            instance: this.instance,
        };
    }
}
