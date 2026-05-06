import {mock} from 'jest-mock-extended';
import type {Logger} from '../index';
import {ContextualLogger} from '../index';

describe('A contextual logger', () => {
    it('should log messages with a context', () => {
        const innerLogger = mock<Logger>();
        const logger = new ContextualLogger(innerLogger, 'CustomContext');

        jest.spyOn(innerLogger, 'log');

        logger.debug('This is a debug message.');

        expect(innerLogger.log).toHaveBeenCalledTimes(1);
        expect(innerLogger.log).toHaveBeenCalledWith({
            level: 'debug',
            message: '[CustomContext] This is a debug message.',
        });
    });

    it('should be able to log messages without a context', () => {
        const innerLogger = mock<Logger>();
        const logger = new ContextualLogger(innerLogger);

        jest.spyOn(innerLogger, 'log');

        logger.debug('This is a debug message.');

        expect(innerLogger.log).toHaveBeenCalledTimes(1);
        expect(innerLogger.log).toHaveBeenCalledWith({
            level: 'debug',
            message: 'This is a debug message.',
        });
    });
});
