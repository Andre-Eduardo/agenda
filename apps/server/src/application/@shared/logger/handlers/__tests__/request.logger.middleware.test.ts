import type {Response, Request} from 'express';
import {mock} from 'jest-mock-extended';
import type {Logger} from '../../index';
import {RequestLoggerMiddleware} from '../index';

describe('A request logger middleware', () => {
    it.each([
        ['Chrome', 'GET /test 200 10.000ms - Chrome 127.0.0.1'],
        [null, 'GET /test 200 10.000ms - Unknown 127.0.0.1'],
    ])('should log the request', (userAgent, log) => {
        jest.useFakeTimers({now: 0});

        const logger = mock<Logger>();
        const middleware = new RequestLoggerMiddleware(logger);

        const request = mock<Request>({
            ip: '127.0.0.1',
            method: 'GET',
            originalUrl: '/test',
            get: jest.fn().mockReturnValue(userAgent),
        });

        const response = mock<Response>({
            on: jest.fn(),
            statusCode: 200,
        });

        const next = jest.fn();

        middleware.use(request, response, next);

        expect(response.on).toHaveBeenCalledTimes(1);
        expect(response.on).toHaveBeenCalledWith('finish', expect.any(Function));

        jest.advanceTimersByTime(10);

        const finishCallback = response.on.mock.calls[0][1];

        finishCallback();

        expect(logger.debug).toHaveBeenCalledTimes(1);
        expect(logger.debug).toHaveBeenCalledWith(log);

        expect(next).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
    });
});
