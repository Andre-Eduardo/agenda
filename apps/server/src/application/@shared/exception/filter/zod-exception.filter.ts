import {ArgumentsHost, Catch, ExceptionFilter} from '@nestjs/common';
import {HttpAdapterHost} from '@nestjs/core';
import {ExpressAdapter} from '@nestjs/platform-express';
import {ZodError} from 'zod';
import {ApiProblemFormatter} from '../../../../infrastructure/exception';
import {PROBLEM_CONTENT_TYPE} from '../api-problem.exception';
import {getViolations} from '../zod.exception';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost<ExpressAdapter>) {}

    catch(exception: ZodError, host: ArgumentsHost): void {
        const {httpAdapter} = this.httpAdapterHost;
        const ctx = host.switchToHttp();

        httpAdapter.setHeader(ctx.getResponse(), 'Content-Type', PROBLEM_CONTENT_TYPE);

        const formatter = new ApiProblemFormatter(httpAdapter.getRequestUrl(ctx.getRequest()));

        const problemDetails = formatter.invalidInput('The payload sent is not valid', getViolations(exception));

        httpAdapter.reply(ctx.getResponse(), problemDetails, problemDetails.status);
    }
}
