import * as stream from 'stream';
import {mock} from 'jest-mock-extended';
// @ts-expect-error Required for better testing
import {MESSAGE} from 'triple-beam';
import * as winston from 'winston';
import {WinstonLogger} from '../index';

type TransformableInfo = winston.Logform.TransformableInfo;

describe('A Winston logger', () => {
    it('should log messages at the specified level', () => {
        const innerLogger = mock<winston.Logger>();

        const logger = new WinstonLogger(innerLogger);

        jest.spyOn(winston, 'log');

        logger.debug('This is a debug message.');
        logger.info('This is an info message.');
        logger.warn('This is a warn message.');
        logger.error('This is an error message.');
        logger.error('This is an error message with details.', 'A detail of the error');
        logger.error('This is an error message with details.', new Error('An error occurred.'));

        expect(innerLogger.log).toHaveBeenCalledTimes(6);
        expect(innerLogger.log).toHaveBeenNthCalledWith(1, {
            level: 'debug',
            message: 'This is a debug message.',
        });
        expect(innerLogger.log).toHaveBeenNthCalledWith(2, {
            level: 'info',
            message: 'This is an info message.',
        });
        expect(innerLogger.log).toHaveBeenNthCalledWith(3, {
            level: 'warn',
            message: 'This is a warn message.',
        });
        expect(innerLogger.log).toHaveBeenNthCalledWith(4, {
            level: 'error',
            message: 'This is an error message.',
        });
        expect(innerLogger.log).toHaveBeenNthCalledWith(5, {
            level: 'error',
            message: 'This is an error message with details.',
            details: "'A detail of the error'",
        });
        expect(innerLogger.log).toHaveBeenNthCalledWith(6, {
            level: 'error',
            message: 'This is an error message with details.',
            details: expect.stringContaining('Error: An error occurred.'),
        });
    });
});

function createLogger(write: (info: TransformableInfo) => void, format: winston.Logform.Format) {
    return winston.createLogger({
        format,
        transports: new winston.transports.Stream({
            stream: new stream.Writable({objectMode: true, write}),
        }),
    });
}

describe('A formatter for Winston logger', () => {
    beforeEach(() => {
        jest.useFakeTimers({now: new Date('2021-01-01T00:00:00.000Z')});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should format the log message', () => {
        const logger = createLogger((info: TransformableInfo) => {
            expect(info.level).toBe('\x1b[32mINFO\x1b[39m');
            expect(info[MESSAGE]).toBe('2021-01-01 00:00:00.000 \x1b[32mINFO\x1b[39m - This is an info message.');
        }, WinstonLogger.format());

        logger.info('This is an info message.');
    });

    it('should format a log message with details', () => {
        const logger = createLogger((info: TransformableInfo) => {
            expect(info.level).toBe('ERROR');
            expect(info[MESSAGE]).toEqual(
                expect.stringMatching(
                    '2021-01-01 00:00:00.000 ERROR - This is an error message with details.\nError: An error occurred.'
                )
            );
        }, WinstonLogger.format(false));

        logger.error('This is an error message with details.', {
            details: new Error('An error occurred.'),
        });

        const logger2 = createLogger((info: TransformableInfo) => {
            expect(info.level).toBe('ERROR');
            expect(info[MESSAGE]).toEqual(
                '2021-01-01 00:00:00.000 ERROR - This is an error message with details.\nSomething went wrong.'
            );
        }, WinstonLogger.format(false));

        logger2.error('This is an error message with details.', {
            details: 'Something went wrong.',
        });
    });

    it.each([
        ['200', '\x1b[32m200\x1b[39m'],
        ['300', '\x1b[36m300\x1b[39m'],
        ['400', '\x1b[33m400\x1b[39m'],
        ['500', '\x1b[31m500\x1b[39m'],
        ['600', '600'],
    ])('should colorize the HTTP status code %s', (statusCode, expected) => {
        const logger = createLogger((info: TransformableInfo) => {
            expect(info[MESSAGE]).toBe(
                `2021-01-01 00:00:00.000 \x1b[32mINFO\x1b[39m - Status code: ${expected} - This is an info message.`
            );
        }, WinstonLogger.format(true));

        logger.info(`Status code: ${statusCode} - This is an info message.`);
    });
});
