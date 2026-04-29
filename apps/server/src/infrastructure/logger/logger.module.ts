import { DynamicModule, Module, Scope } from "@nestjs/common";
import { INQUIRER } from "@nestjs/core";
import * as winston from "winston";
import { Logger, ContextualLogger } from "@application/@shared/logger";
import { ConfigModule } from "@infrastructure/config";
import { WinstonLogger } from "@infrastructure/logger/winston.logger";

const LOGGER_CONTEXT = "LOGGER_CONTEXT";

@Module({})
export class LoggerModule {
  /**
   * Register a logger module
   * @param context A custom context for the logger, useful when the current context cannot be inferred.
   */
  static register(context?: string): DynamicModule {
    return {
      imports: [ConfigModule],
      providers: [
        {
          provide: LOGGER_CONTEXT,
          scope: Scope.TRANSIENT,
          useValue: context,
        },
        {
          provide: Logger,
          scope: Scope.TRANSIENT,
          useFactory: (parentClass: object, loggerContext?: string): Logger => {
            const transports: winston.transport[] = [
              new winston.transports.Console({
                level: "debug",
                format: WinstonLogger.format(),
              }),
            ];

            return new ContextualLogger(
              new WinstonLogger(winston.createLogger({ transports })),
              loggerContext ?? parentClass?.constructor?.name,
            );
          },
          inject: [INQUIRER, LOGGER_CONTEXT],
        },
      ],
      exports: [Logger],
      module: LoggerModule,
    };
  }
}
