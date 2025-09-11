import {HttpException} from '@nestjs/common';
import type {ArgumentsHost} from '@nestjs/common';
import type {HttpArgumentsHost} from '@nestjs/common/interfaces';
import type {HttpAdapterHost} from '@nestjs/core';
import type {ExpressAdapter} from '@nestjs/platform-express';
import {mockDeep} from 'jest-mock-extended';
import {HttpExceptionFilter} from '../index';

describe('An HTTP exception filter', () => {
    const adapterHost = mockDeep<HttpAdapterHost<ExpressAdapter>>();
    const filter = new HttpExceptionFilter(adapterHost);
    const host = mockDeep<ArgumentsHost>();
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    it.each([
        [
            'Not found',
            {
                title: 'Not found',
                detail: 'Not found',
            },
        ],
        [
            {
                error: 'An error',
            },
            {
                title: 'An error',
                detail: 'Http Exception',
            },
        ],
        [
            {
                unknown: 'error',
            },
            {
                title: 'Http Exception',
                detail: 'Http Exception',
            },
        ],
    ])('should catch and format exceptions', (exceptionMessage, problem) => {
        const exception = new HttpException(exceptionMessage, 404);
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
                ...problem,
                type: 'https://developer.mozilla.org/docs/Web/HTTP/Status/404',
                status: 404,
                instance: requestUrl,
            },
            404
        );
    });
});
