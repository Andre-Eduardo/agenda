import {describeError, maskDestination} from '../notification-log.util';

describe('Notification log helpers', () => {
    it.each([
        ['5511987654321', '55*******4321'],
        ['maria.silva@example.com', 'ma***@example.com'],
        ['a@example.com', 'a***@example.com'],
        ['12345', '*****'],
    ])('should mask %s as %s', (input, expected) => {
        expect(maskDestination(input)).toBe(expected);
    });

    it('should describe errors', () => {
        expect(describeError(new Error('boom'))).toBe('boom');
        expect(describeError(new TypeError('fetch failed'))).toBe('TypeError: fetch failed');
        expect(describeError('raw')).toBe('raw');
    });
});
