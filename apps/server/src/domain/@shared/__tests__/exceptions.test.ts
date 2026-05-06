import type {ExceptionFormatter} from '../exceptions';
import {
    AccessDeniedReason,
    AccessDeniedException,
    ExceptionBase,
    InvalidInputException,
    PreconditionException,
    ResourceNotFoundException,
    UnauthenticatedException,
} from '../exceptions';

class StringErrorFormatter implements ExceptionFormatter<string> {
    public invalidInput(message: string): string {
        return message;
    }

    public resourceNotFound(message: string): string {
        return message;
    }

    public operationConflict(message: string): string {
        return message;
    }

    public accessDenied(message: string, reason: AccessDeniedReason): string {
        return message + reason;
    }

    public unauthenticated(): string {
        return 'unauthenticated';
    }
}

class ExceptionTest extends ExceptionBase {
    format<T>(formatter: ExceptionFormatter<T>): T {
        return formatter.invalidInput(this.message);
    }
}

describe('An exception', () => {
    it('should capture the stack trace', () => {
        const error = new ExceptionTest('Test error');

        expect(error.stack).toBeDefined();
    });
});

describe('An InvalidInputException', () => {
    it('should be formattable', () => {
        const formatter = new StringErrorFormatter();

        jest.spyOn(formatter, 'invalidInput');

        const error = new InvalidInputException('Invalid input', [{field: 'foo', reason: 'bar'}]);

        error.format(formatter);

        expect(formatter.invalidInput).toHaveBeenCalledTimes(1);
        expect(formatter.invalidInput).toHaveBeenCalledWith('Invalid input', [{field: 'foo', reason: 'bar'}]);
    });
});

describe('A ResourceNotFoundException', () => {
    it('should be formattable', () => {
        const resource = 'resource-id';

        const formatter = new StringErrorFormatter();

        jest.spyOn(formatter, 'resourceNotFound');

        const error = new ResourceNotFoundException('Resource not found', resource);

        error.format(formatter);

        expect(formatter.resourceNotFound).toHaveBeenCalledTimes(1);
        expect(formatter.resourceNotFound).toHaveBeenCalledWith('Resource not found', resource);
    });
});

describe('A PreconditionException', () => {
    it('should be formattable', () => {
        const formatter = new StringErrorFormatter();

        jest.spyOn(formatter, 'operationConflict');

        const error = new PreconditionException('Operation conflict');

        error.format(formatter);

        expect(formatter.operationConflict).toHaveBeenCalledTimes(1);
        expect(formatter.operationConflict).toHaveBeenCalledWith('Operation conflict');
    });
});

describe('An AccessDeniedException', () => {
    it('should be formattable', () => {
        const reason = AccessDeniedReason.BAD_CREDENTIALS;

        const formatter = new StringErrorFormatter();

        jest.spyOn(formatter, 'accessDenied');

        const error = new AccessDeniedException('Access denied', reason);

        error.format(formatter);

        expect(formatter.accessDenied).toHaveBeenCalledTimes(1);
        expect(formatter.accessDenied).toHaveBeenCalledWith('Access denied', reason);
    });
});

describe('An UnauthenticatedException', () => {
    it('should be formattable', () => {
        const formatter = new StringErrorFormatter();

        jest.spyOn(formatter, 'unauthenticated');

        const error = new UnauthenticatedException('Unauthenticated');

        error.format(formatter);

        expect(formatter.unauthenticated).toHaveBeenCalledTimes(1);
        expect(formatter.unauthenticated).toHaveBeenCalled();
    });
});
