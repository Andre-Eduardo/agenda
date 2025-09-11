import {ArgumentsHost, Catch, ExceptionFilter, HttpException} from '@nestjs/common';
import {HttpAdapterHost} from '@nestjs/core';
import {ExpressAdapter} from '@nestjs/platform-express';
import {ApiProblem, PROBLEM_CONTENT_TYPE, PROBLEM_URI} from '../api-problem.exception';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost<ExpressAdapter>) {}

    catch(exception: HttpException, host: ArgumentsHost): void {
        const {httpAdapter} = this.httpAdapterHost;

        const ctx = host.switchToHttp();
        const status = exception.getStatus();
        const errorResponse = exception.getResponse() as string | {error?: string};

        const title = (typeof errorResponse === 'string' ? errorResponse : errorResponse.error) ?? exception.message;
        const detail = exception.message;

        const responseBody: ApiProblem = {
            title,
            type: PROBLEM_URI + status,
            detail,
            status,
            instance: httpAdapter.getRequestUrl(ctx.getRequest()),
        };

        httpAdapter.setHeader(ctx.getResponse(), 'Content-Type', PROBLEM_CONTENT_TYPE);
        httpAdapter.reply(ctx.getResponse(), responseBody, status);
    }
}
