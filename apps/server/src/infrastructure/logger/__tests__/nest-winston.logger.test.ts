import {mock} from 'jest-mock-extended';
import type * as winston from 'winston';
import {NestWinstonLogger} from '../nest-winston.logger';

describe('The Nest winston logger', () => {
    const logger = mock<winston.Logger>();
    const nestLogger = new NestWinstonLogger(logger);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should prefix the context Nest passes as last argument', () => {
        nestLogger.log('Running reminder dispatch...', 'ReminderDispatchTask');

        expect(logger.log).toHaveBeenCalledWith({
            level: 'info',
            message: '[ReminderDispatchTask] Running reminder dispatch...',
            context: 'ReminderDispatchTask',
        });
    });

    it('should keep the error stack as details', () => {
        const error = new Error('boom');

        nestLogger.error('Failed to dispatch reminder', error, 'DispatchRemindersService');

        expect(logger.log).toHaveBeenCalledWith(
            expect.objectContaining({
                level: 'error',
                message: '[DispatchRemindersService] Failed to dispatch reminder',
                details: expect.stringContaining('Error: boom'),
            })
        );
    });

    it('should map verbose to debug and fatal to error', () => {
        nestLogger.verbose('v');
        nestLogger.fatal('f');

        expect(logger.log).toHaveBeenNthCalledWith(1, {level: 'debug', message: 'v'});
        expect(logger.log).toHaveBeenNthCalledWith(2, {level: 'error', message: 'f'});
    });
});
