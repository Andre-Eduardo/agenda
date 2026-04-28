import {inspect} from 'util';
import {Injectable} from '@nestjs/common';
import * as winston from 'winston';
import {Log, Logger} from '../../application/@shared/logger';

@Injectable()
export class WinstonLogger extends Logger {
    constructor(private readonly logger: winston.Logger) {
        super();
    }

    static format(colorize = true): winston.Logform.Format {
        return winston.format.combine(
            winston.format((info) => {
                // Winston allow non-string messages, but our logger interface enforce only string messages.
                const message = info.message as string;

                return {
                    ...info,
                    level: info.level.toUpperCase(),
                    message: colorize ? this.colorizeHttpStatusCode(message) : message,
                };
            })(),
            winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
            colorize ? winston.format.colorize({level: true}) : winston.format.uncolorize(),
            winston.format.printf((info) => {
                let details = '';

                if (info.details) {
                    details =
                        typeof info.details === 'string'
                            ? `\n${info.details}`
                            : `\n${inspect(info.details, {colors: colorize, compact: false})}`;
                }

                return `${info.timestamp} ${info.level} - ${info.message}${details}`;
            })
        );
    }

    private static colorizeHttpStatusCode(value: string): string {
        return value.replaceAll(/((?<=\s)[1-5][0-9][0-9](?=\s))/g, (match: string) => {
            const statusCode = parseInt(match.trim(), 10);

            if (statusCode >= 500) {
                return `\x1B[31m${match}\x1B[39m`; // Red
            }

            if (statusCode >= 400) {
                return `\x1B[33m${match}\x1B[39m`; // Yellow
            }

            if (statusCode >= 300) {
                return `\x1B[36m${match}\x1B[39m`; // Cyan
            }

            return `\x1B[32m${match}\x1B[39m`; // Green
        });
    }

    log(log: Log): void {
        this.logger.log(log);
    }
}
