import {CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor} from '@nestjs/common';
import {Request, Response} from 'express';
import {catchError, from, mergeMap, Observable, throwError} from 'rxjs';
import {ZodError} from 'zod';
import {auditResourceId} from '@application/audit/audit-resource-id';
import {
    AccessDeniedException,
    ExceptionBase,
    InvalidInputException,
    PreconditionException,
    ResourceNotFoundException,
    UnauthenticatedException,
} from '@domain/@shared/exceptions';
import {AuditLogRepository, NewAuditLogEntry} from '@domain/audit/audit-log.repository';

/** Records an authenticated operation before its HTTP response is sent. */
@Injectable()
export class AuditHttpInterceptor implements NestInterceptor {
    constructor(private readonly auditLogRepository: AuditLogRepository) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const {actor} = request;

        if (actor.userId === null || actor.clinicId === null || actor.clinicMemberId === null) {
            return next.handle();
        }

        const base: Omit<NewAuditLogEntry, 'resourceId' | 'result' | 'statusCode'> = {
            clinicId: actor.clinicId.toString(),
            actorUserId: actor.userId.toString(),
            actorMemberId: actor.clinicMemberId.toString(),
            resource: context.getClass().name,
            action: `${request.method}:${context.getHandler().name}`,
            ip: actor.ip,
        };
        const parameterId = auditResourceId(request.params);

        return next.handle().pipe(
            catchError((error: unknown) =>
                from(
                    this.auditLogRepository.append({
                        ...base,
                        resourceId: parameterId,
                        result: this.statusCode(error) === 403 ? 'DENIED' : 'ERROR',
                        statusCode: this.statusCode(error),
                    })
                ).pipe(mergeMap(() => throwError(() => error)))
            ),
            mergeMap((value: unknown) =>
                from(
                    this.auditLogRepository.append({
                        ...base,
                        resourceId: parameterId ?? this.responseId(value),
                        result: 'SUCCESS',
                        statusCode: response.statusCode,
                    })
                ).pipe(mergeMap(() => [value]))
            )
        );
    }

    private responseId(value: unknown): string | null {
        if (value !== null && typeof value === 'object' && 'id' in value && typeof value.id === 'string') {
            return value.id;
        }

        return null;
    }

    private statusCode(error: unknown): number {
        if (error instanceof HttpException) return error.getStatus();

        if (error instanceof AccessDeniedException) return 403;

        if (error instanceof UnauthenticatedException) return 401;

        if (error instanceof InvalidInputException || error instanceof ZodError) return 400;

        if (error instanceof ResourceNotFoundException) return 404;

        if (error instanceof PreconditionException) return 409;

        if (error instanceof ExceptionBase) return 500;

        return 500;
    }
}
