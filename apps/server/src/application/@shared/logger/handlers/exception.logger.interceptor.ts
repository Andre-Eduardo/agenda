import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from '@nestjs/common';
import {catchError, Observable} from 'rxjs';
import {ZodError} from 'zod';
import {ExceptionBase} from '../../../../domain/@shared/exceptions';
import {getViolations} from '../../exception';
import {Logger, ContextualLogger} from '../../logger';

/**
 * Interceptor that logs exceptions.
 */
@Injectable()
export class ExceptionLoggerInterceptor implements NestInterceptor {
    private logger: Logger | undefined;

    constructor(private readonly upstreamLogger: Logger) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<undefined> {
        return next.handle().pipe(
            catchError((error) => {
                this.logger = new ContextualLogger(this.upstreamLogger, context.getClass().name);

                if (error instanceof ExceptionBase) {
                    this.logger.warn(error.message);
                } else if (error instanceof ZodError) {
                    this.logger.warn('Invalid payload', {violations: getViolations(error)});
                } else {
                    this.logger.error('Unexpected error', error);
                }

                throw error;
            })
        );
    }
}
