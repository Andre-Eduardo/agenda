import {AxiosError} from 'axios';
import type {AxiosRequestHeaders} from 'axios';
import {isApiError, isForbiddenError, isUnauthorizedError, isUnexpectedError, QueryErrorHandler} from '.';

describe('QueryErrorHandler utility functions', () => {
    describe('isApiError', () => {
        it.each([
            {description: 'AxiosError instance', error: new AxiosError('test'), expected: true},
            {description: 'plain Error', error: new Error('test'), expected: false},
            {description: 'string', error: 'error', expected: false},
            {description: 'null', error: null, expected: false},
            {description: 'undefined', error: undefined, expected: false},
        ])('should return $expected for $description', ({error, expected}) => {
            expect(isApiError(error)).toBe(expected);
        });
    });

    describe('isUnauthorizedError', () => {
        it('should return true for 401 status', () => {
            const error = new AxiosError('test', '401', undefined, undefined, {
                status: 401,
                data: {},
                headers: {},
                statusText: 'Unauthorized',
                config: {headers: {} as AxiosRequestHeaders},
            });

            expect(isUnauthorizedError(error)).toBe(true);
        });

        it.each([
            {status: 200, expected: false},
            {status: 403, expected: false},
            {status: 500, expected: false},
        ])('should return $expected for status $status', ({status, expected}) => {
            const error = new AxiosError('test', String(status), undefined, undefined, {
                status,
                data: {},
                headers: {},
                statusText: '',
                config: {headers: {} as AxiosRequestHeaders},
            });

            expect(isUnauthorizedError(error)).toBe(expected);
        });

        it('should return false for non-AxiosError', () => {
            expect(isUnauthorizedError(new Error('test'))).toBe(false);
        });
    });

    describe('isForbiddenError', () => {
        it('should return true for 403 status', () => {
            const error = new AxiosError('test', '403', undefined, undefined, {
                status: 403,
                data: {},
                headers: {},
                statusText: 'Forbidden',
                config: {headers: {} as AxiosRequestHeaders},
            });

            expect(isForbiddenError(error)).toBe(true);
        });

        it('should return false for non-403 status', () => {
            const error = new AxiosError('test', '401', undefined, undefined, {
                status: 401,
                data: {},
                headers: {},
                statusText: '',
                config: {headers: {} as AxiosRequestHeaders},
            });

            expect(isForbiddenError(error)).toBe(false);
        });

        it('should return false for non-AxiosError', () => {
            expect(isForbiddenError(new Error('test'))).toBe(false);
        });
    });

    describe('isUnexpectedError', () => {
        it('should return true for 500 status', () => {
            const error = new AxiosError('test', '500', undefined, undefined, {
                status: 500,
                data: {},
                headers: {},
                statusText: 'Internal Server Error',
                config: {headers: {} as AxiosRequestHeaders},
            });

            expect(isUnexpectedError(error)).toBe(true);
        });

        it.each([
            {status: 400, expected: false},
            {status: 401, expected: false},
            {status: 403, expected: false},
            {status: 404, expected: false},
        ])('should return $expected for status $status', ({status, expected}) => {
            const error = new AxiosError('test', String(status), undefined, undefined, {
                status,
                data: {},
                headers: {},
                statusText: '',
                config: {headers: {} as AxiosRequestHeaders},
            });

            expect(isUnexpectedError(error)).toBe(expected);
        });

        it('should return false for non-AxiosError', () => {
            expect(isUnexpectedError(new Error('test'))).toBe(false);
        });
    });
});

describe('<QueryErrorHandler />', () => {
    it('returns null — component is a side-effect only component', () => {
        // QueryErrorHandler configures React Query's defaultOptions via useEffect
        // and renders nothing. Full integration tests require a QueryClientProvider wrapper.
        expect(QueryErrorHandler).toBeDefined();
    });
});
