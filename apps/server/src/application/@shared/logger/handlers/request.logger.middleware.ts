import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { Logger } from "@application/@shared/logger/logger";

/**
 * Middleware that logs requests.
 *
 * It cannot be a global interceptor since exception filters run after interceptors, so the response can be changed
 * by the exception filter and the interceptor wouldn't get a correct response status code, and the response time
 * will not be accurate as the exception filter processing will not be accounted for.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get("user-agent") ?? "Unknown";

    const start = performance.now();

    response.on("finish", () => {
      const { statusCode } = response;
      const responseTime = (performance.now() - start).toFixed(3);

      this.logger.debug(
        `${method} ${originalUrl} ${statusCode} ${responseTime}ms - ${userAgent} ${ip}`,
      );
    });

    next();
  }
}
