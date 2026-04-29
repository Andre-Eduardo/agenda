import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { ExceptionBase } from "@domain/@shared/exceptions";
import { ApiProblemFormatter } from "@infrastructure/exception";
import { PROBLEM_CONTENT_TYPE } from "@application/@shared/exception/api-problem.exception";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost<ExpressAdapter>) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    httpAdapter.setHeader(ctx.getResponse(), "Content-Type", PROBLEM_CONTENT_TYPE);

    const formatter = new ApiProblemFormatter(httpAdapter.getRequestUrl(ctx.getRequest()));

    if (exception instanceof ExceptionBase) {
      const problemDetails = exception.format(formatter);

      httpAdapter.reply(ctx.getResponse(), problemDetails, problemDetails.status);

      return;
    }

    const problemDetails = formatter.unexpectedError();

    httpAdapter.reply(ctx.getResponse(), problemDetails, problemDetails.status);
  }
}
