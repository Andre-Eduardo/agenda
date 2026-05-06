import {isEquatable} from '../index';

describe('Equatable', () => {
    it('should be able to check if a value is equatable', () => {
        const value = {
            equals: () => true,
        };

        expect(isEquatable(value)).toBe(true);
    });

    it('should be able to check if a value is not equatable', () => {
        const value = {
            equals: 'not a function',
        };

        expect(isEquatable(value)).toBe(false);

        const value2 = {
            match: () => true,
        };

        expect(isEquatable(value2)).toBe(false);
    });
});
