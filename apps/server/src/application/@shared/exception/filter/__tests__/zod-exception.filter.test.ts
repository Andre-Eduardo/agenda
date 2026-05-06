import type {ArgumentsHost} from '@nestjs/common';
import type {HttpArgumentsHost} from '@nestjs/common/interfaces';
import type {HttpAdapterHost} from '@nestjs/core';
import type {ExpressAdapter} from '@nestjs/platform-express';
import {mockDeep} from 'jest-mock-extended';
import {ZodError} from 'zod';
import {ZodExceptionFilter} from '../index';

describe('A Zod exception filter', () => {
    const adapterHost = mockDeep<HttpAdapterHost<ExpressAdapter>>();
    const filter = new ZodExceptionFilter(adapterHost);
    const host = mockDeep<ArgumentsHost>();
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    it('should catch and format expected exceptions', () => {
        const exception = new ZodError([
            {
                code: 'custom',
                path: ['foo', 'bar'],
                message: 'Test message',
            },
        ]);
        const requestUrl = '/api/v1/test';

        jest.spyOn(host, 'switchToHttp').mockReturnValue(httpArgumentsHost);
        jest.spyOn(adapterHost.httpAdapter, 'getRequestUrl').mockReturnValue(requestUrl);

        filter.catch(exception, host);

        expect(adapterHost.httpAdapter.setHeader).toHaveBeenCalledTimes(1);
        expect(adapterHost.httpAdapter.setHeader).toHaveBeenCalledWith(
            httpArgumentsHost.getResponse(),
            'Content-Type',
            'application/problem+json'
        );

        expect(adapterHost.httpAdapter.reply).toHaveBeenCalledTimes(1);
        expect(adapterHost.httpAdapter.reply).toHaveBeenCalledWith(
            httpArgumentsHost.getResponse(),
            {
                title: 'Invalid input',
                type: 'https://developer.mozilla.org/docs/Web/HTTP/Status/400',
                detail: 'The payload sent is not valid',
                status: 400,
                instance: requestUrl,
                violations: [
                    {
                        field: 'foo.bar',
                        reason: 'Test message',
                    },
                ],
            },
            400
        );
    });
});
