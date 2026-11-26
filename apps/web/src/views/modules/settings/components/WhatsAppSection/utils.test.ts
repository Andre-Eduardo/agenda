import {describe, expect, it} from 'vitest';
import {formatPhone, isValidPhone} from './utils';

describe('WhatsApp section helpers', () => {
    it.each([
        ['11987654321', true],
        ['(11) 3456-7890', true],
        ['987654321', false],
        ['5511987654321', false],
    ])('should validate %s as %s', (value, expected) => {
        expect(isValidPhone(value)).toBe(expected);
    });

    it.each([
        ['5511987654321', '(11) 98765-4321'],
        ['551134567890', '(11) 3456-7890'],
        ['11987654321', '(11) 98765-4321'],
        ['12025550143', '(12) 02555-0143'],
        ['123', '123'],
        [null, '—'],
    ])('should format %s as %s', (value, expected) => {
        expect(formatPhone(value)).toBe(expected);
    });
});
