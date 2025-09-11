import {AccessDeniedReason} from '../../../domain/@shared/exceptions';
import {ApiProblemFormatter, ApiProblemType} from '../index';

describe('An API problem formatter', () => {
    it('should handle unexpected errors', () => {
        const formatter = new ApiProblemFormatter('/api/foo');
        const problem = formatter.unexpectedError();

        expect(problem).toEqual({
            title: 'Unexpected error',
            type: ApiProblemType.UNEXPECTED_ERROR,
            detail: 'An unexpected error occurred.',
            status: 500,
            instance: '/api/foo',
        });
    });

    it('should handle invalid inputs', () => {
        const formatter = new ApiProblemFormatter('/api/foo');
        const problem = formatter.invalidInput('The payload is invalid.', [
            {
                field: 'foo',
                reason: 'Field is required.',
            },
        ]);

        expect(problem).toEqual({
            title: 'Invalid input',
            type: ApiProblemType.INVALID_INPUT,
            detail: 'The payload is invalid.',
            violations: [
                {
                    field: 'foo',
                    reason: 'Field is required.',
                },
            ],
            status: 400,
            instance: '/api/foo',
        });
    });

    it('should handle resource not found errors', () => {
        const formatter = new ApiProblemFormatter('/api/foo');
        const problem = formatter.resourceNotFound('The resource was not found.');

        expect(problem).toEqual({
            title: 'Resource not found',
            type: ApiProblemType.RESOURCE_NOT_FOUND,
            detail: 'The resource was not found.',
            status: 404,
            instance: '/api/foo',
        });
    });

    it('should handle failed preconditions', () => {
        const formatter = new ApiProblemFormatter('/api/foo');
        const problem = formatter.operationConflict('The preconditions were not met.');

        expect(problem).toEqual({
            title: 'Preconditions not met for the required operation',
            type: ApiProblemType.OPERATION_CONFLICT,
            detail: 'The preconditions were not met.',
            status: 409,
            instance: '/api/foo',
        });
    });

    it('should handle access denied errors', () => {
        const formatter = new ApiProblemFormatter('/api/foo');
        const problem = formatter.accessDenied('Wrong password', AccessDeniedReason.UNKNOWN_USER);

        expect(problem).toEqual({
            title: 'Access denied',
            type: ApiProblemType.ACCESS_DENIED,
            detail: 'Wrong password',
            status: 403,
            instance: '/api/foo',
            reason: 'UNKNOWN_USER',
        });
    });

    it('should handle unauthenticated errors', () => {
        const formatter = new ApiProblemFormatter('/api/foo');
        const problem = formatter.unauthenticated();

        expect(problem).toEqual({
            title: 'Authentication required',
            type: ApiProblemType.UNAUTHENTICATED,
            detail: 'Authentication is required to access this resource.',
            status: 401,
            instance: '/api/foo',
        });
    });
});
