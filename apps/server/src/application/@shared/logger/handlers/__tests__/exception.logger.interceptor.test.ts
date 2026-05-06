import type {ExecutionContext} from '@nestjs/common';
import {mock} from 'jest-mock-extended';
import {throwError} from 'rxjs';
import {ZodError} from 'zod';
import {ResourceNotFoundException} from '../../../../../domain/@shared/exceptions';
import type {Logger} from '../../index';
import {ExceptionLoggerInterceptor} from '../index';

describe('An exception logger interceptor', () => {
    it('should handle expected exceptions and log them', () =>
        new Promise((done) => {
            const logger = mock<Logger>();
            const interceptor = new ExceptionLoggerInterceptor(logger);
            const context = mock<ExecutionContext>({
                getClass: jest.fn().mockReturnValue({name: 'CustomClass'}),
            });

            const error = new ResourceNotFoundException('Object not found.');
            const next = {
                handle() {
                    return throwError(() => error);
                },
            };

            interceptor.intercept(context, next).subscribe({
                error: (err: unknown) => {
                    expect(err).toBe(error);
                    expect(logger.log).toHaveBeenCalledTimes(1);
                    expect(logger.log).toHaveBeenCalledWith({
                        level: 'warn',
                        message: '[CustomClass] Object not found.',
                    });

                    done();
                },
            });
        }));

    it('should handle Zod errors and log them', () =>
        new Promise((done) => {
            const logger = mock<Logger>();
            const interceptor = new ExceptionLoggerInterceptor(logger);
            const context = mock<ExecutionContext>({
                getClass: jest.fn().mockReturnValue({name: 'CustomClass'}),
            });

            const error = new ZodError([
                {
                    code: 'custom',
                    path: ['foo', 'bar'],
                    message: 'Test message',
                },
            ]);
            const next = {
                handle() {
                    return throwError(() => error);
                },
            };

            interceptor.intercept(context, next).subscribe({
                error: (err: unknown) => {
                    expect(err).toBe(error);
                    expect(logger.log).toHaveBeenCalledTimes(1);
                    expect(logger.log).toHaveBeenCalledWith({
                        level: 'warn',
                        message: '[CustomClass] Invalid payload',
                        details: {
                            violations: [
                                {
                                    field: 'foo.bar',
                                    reason: 'Test message',
                                },
                            ],
                        },
                    });

                    done();
                },
            });
        }));

    it('should handle unexpected errors and log them', () =>
        new Promise((done) => {
            const logger = mock<Logger>();
            const interceptor = new ExceptionLoggerInterceptor(logger);
            const context = mock<ExecutionContext>({
                getClass: jest.fn().mockReturnValue({name: 'CustomClass'}),
            });

            const error = new Error('Unknown error.');
            const next = {
                handle() {
                    return throwError(() => error);
                },
            };

            interceptor.intercept(context, next).subscribe({
                error: (err: unknown) => {
                    expect(err).toBe(error);
                    expect(logger.log).toHaveBeenCalledTimes(1);
                    expect(logger.log).toHaveBeenCalledWith({
                        level: 'error',
                        message: '[CustomClass] Unexpected error',
                        details: expect.stringMatching('Unknown error.'),
                    });

                    done();
                },
            });
        }));
});
