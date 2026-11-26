import assert from 'node:assert/strict';
import {test} from 'node:test';
import {nextDailyRun, parseSchedule, positiveMinutes} from './scheduler.mjs';

test('parses HH:MM schedules in UTC', () => {
    assert.deepEqual(parseSchedule('05:00'), {hour: 5, minute: 0});
    assert.deepEqual(parseSchedule(' 23:59 '), {hour: 23, minute: 59});
    assert.deepEqual(parseSchedule(), {hour: 5, minute: 0});
    assert.throws(() => parseSchedule('24:00'));
    assert.throws(() => parseSchedule('5h'));
});

test('schedules the next run later today or tomorrow', () => {
    const schedule = {hour: 5, minute: 0};

    assert.equal(
        nextDailyRun(new Date('2026-11-26T01:00:00Z'), schedule).toISOString(),
        '2026-11-26T05:00:00.000Z'
    );
    assert.equal(
        nextDailyRun(new Date('2026-11-26T05:00:00Z'), schedule).toISOString(),
        '2026-11-27T05:00:00.000Z'
    );
    assert.equal(
        nextDailyRun(new Date('2026-12-31T06:00:00Z'), schedule).toISOString(),
        '2027-01-01T05:00:00.000Z'
    );
});

test('validates the check interval', () => {
    assert.equal(positiveMinutes(undefined, 60), 60);
    assert.equal(positiveMinutes('15', 60), 15);
    assert.throws(() => positiveMinutes('0', 60));
    assert.throws(() => positiveMinutes('abc', 60));
});
