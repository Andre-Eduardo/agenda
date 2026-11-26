import {inspect} from 'util';
import type {LoggerService} from '@nestjs/common';
import * as winston from 'winston';
import {WinstonLogger} from '@infrastructure/logger/winston.logger';

type WinstonLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Routes Nest's built-in `Logger` (used across the app as `new Logger(Context)`) through winston,
 * so those logs reach the same console format and — when telemetry is on — the OTLP transport
 * that the winston instrumentation attaches (Grafana Loki).
 */
export class NestWinstonLogger implements LoggerService {
    constructor(
        private readonly logger: winston.Logger = winston.createLogger({
            transports: [new winston.transports.Console({level: 'debug', format: WinstonLogger.format()})],
        })
    ) {}

    log(message: unknown, ...optionalParams: unknown[]): void {
        this.write('info', message, optionalParams);
    }

    error(message: unknown, ...optionalParams: unknown[]): void {
        this.write('error', message, optionalParams);
    }

    warn(message: unknown, ...optionalParams: unknown[]): void {
        this.write('warn', message, optionalParams);
    }

    debug(message: unknown, ...optionalParams: unknown[]): void {
        this.write('debug', message, optionalParams);
    }

    verbose(message: unknown, ...optionalParams: unknown[]): void {
        this.write('debug', message, optionalParams);
    }

    fatal(message: unknown, ...optionalParams: unknown[]): void {
        this.write('error', message, optionalParams);
    }

    private write(level: WinstonLevel, message: unknown, optionalParams: unknown[]): void {
        // Nest passes the context as the last string argument.
        const params = [...optionalParams];
        const context = params.length > 0 && typeof params.at(-1) === 'string' ? String(params.pop()) : undefined;
        const text = typeof message === 'string' ? message : inspect(message);
        const details = params
            .map((param) => (param instanceof Error ? (param.stack ?? param.message) : stringify(param)))
            .filter((value) => value !== '')
            .join('\n');

        this.logger.log({
            level,
            message: context === undefined ? text : `[${context}] ${text}`,
            ...(details === '' ? {} : {details}),
            ...(context === undefined ? {} : {context}),
        });
    }
}

function stringify(value: unknown): string {
    if (value === undefined || value === null) return '';

    return typeof value === 'string' ? value : inspect(value);
}
