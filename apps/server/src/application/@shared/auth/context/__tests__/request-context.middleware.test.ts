import type {Response, Request, CookieOptions} from 'express';
import {mock} from 'jest-mock-extended';
import {ExpressContextActions} from '../../../../../infrastructure/auth';
import {RequestContextMiddleware} from '../request-context.middleware';

jest.mock('../../../../../infrastructure/auth', () => ({
    ExpressContextActions: jest.fn(),
}));

describe('A request context middleware', () => {
    const cookieOptions: CookieOptions = {
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        signed: true,
    };
    const middleware = new RequestContextMiddleware('authCookie', 'companyCookie', cookieOptions);

    it.each([
        [undefined, '0.0.0.0'],
        ['127.0.0.1', '127.0.0.1'],
    ])('should define the actor on the request', (requestIp, actorIp) => {
        const request = mock<Request>({
            ip: requestIp,
            hostname: 'example.com',
            signedCookies: {
                companyCookie: 'company-id',
            },
        });

        const response = mock<Response>();

        const next = jest.fn();

        middleware.use(request, response, next);

        expect(request.actor).toEqual({
            userId: null,
            ip: actorIp,
        });

        expect(next).toHaveBeenCalledTimes(1);
    });

    it('should define the company ID on the request query params', () => {
        const request = {
            signedCookies: {
                companyCookie: 'company-id',
            },
            method: 'GET',
            query: {
                foo: 'bar',
            },
        } as unknown as Request;

        const response = mock<Response>();

        const next = jest.fn();

        middleware.use(request, response, next);

        expect(request.query).toEqual({
            foo: 'bar',
            companyId: 'company-id',
        });

        expect(next).toHaveBeenCalledTimes(1);
    });

    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('should define the company ID on the request body', (method) => {
        const request = {
            signedCookies: {
                companyCookie: 'company-id',
            },
            method,
            body: {
                foo: 'bar',
            },
        } as unknown as Request;

        const response = mock<Response>();

        const next = jest.fn();

        middleware.use(request, response, next);

        expect(request.body).toEqual({
            foo: 'bar',
            companyId: 'company-id',
        });

        expect(next).toHaveBeenCalledTimes(1);
    });

    it('should define the context actions on the response', () => {
        const request = mock<Request>({
            hostname: 'example.com',
        });

        const response = mock<Response>({
            actions: undefined,
        });

        const next = jest.fn();

        middleware.use(request, response, next);

        expect(response.actions).toBeInstanceOf(ExpressContextActions);
        expect(ExpressContextActions).toHaveBeenCalledWith(response, 'authCookie', 'companyCookie', {
            ...cookieOptions,
            domain: 'example.com',
        });

        expect(next).toHaveBeenCalledTimes(1);
    });
});
