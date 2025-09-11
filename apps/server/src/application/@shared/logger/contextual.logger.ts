import {Injectable} from '@nestjs/common';
import {Log, Logger} from './logger';

@Injectable()
export class ContextualLogger extends Logger {
    constructor(
        private readonly logger: Logger,
        private readonly context?: string
    ) {
        super();
    }

    log(log: Log): void {
        this.logger.log({
            ...log,
            message: `${this.context ? `[${this.context}] ${log.message}` : log.message}`,
        });
    }
}
