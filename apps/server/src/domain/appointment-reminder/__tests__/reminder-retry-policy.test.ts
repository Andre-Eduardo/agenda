import {nextReminderRetryAt, REMINDER_MAX_ATTEMPTS} from '@domain/appointment-reminder/reminder-retry-policy';

describe('The reminder retry policy', () => {
    const failedAt = new Date('2026-11-30T10:00:00Z');
    const startAt = new Date('2026-12-01T10:00:00Z');

    it('should allow three attempts', () => {
        expect(REMINDER_MAX_ATTEMPTS).toBe(3);
    });

    it.each([
        [1, '2026-11-30T10:15:00.000Z'],
        [2, '2026-11-30T11:00:00.000Z'],
    ])('should retry after attempt %i at %s', (attempt, expected) => {
        expect(nextReminderRetryAt(attempt, failedAt, startAt)?.toISOString()).toBe(expected);
    });

    it('should stop after the last attempt', () => {
        expect(nextReminderRetryAt(3, failedAt, startAt)).toBeNull();
    });

    it('should not retry past the appointment start', () => {
        expect(nextReminderRetryAt(1, failedAt, new Date('2026-11-30T10:10:00Z'))).toBeNull();
    });
});
