import {mapValues} from './mapValues';

describe('mapValues', () => {
    it('should map values using the specified mapper', () => {
        expect(mapValues({a: 1, b: 2}, (value) => value + 1)).toStrictEqual({a: 2, b: 3});
    });

    it('should map values using the specified mapping', () => {
        expect(mapValues({a: 1, b: 2, c: null, e: undefined, f: {}}, {1: 'a', 2: 'b'})).toStrictEqual({
            a: 'a',
            b: 'b',
            c: null,
            e: undefined,
            f: {},
        });
    });

    it('should map key-values using the specified mapping', () => {
        expect(mapValues('a', {a: 'b', c: 'd'})).toBe('b');
    });

    it('should map key-values using the specified mapper', () => {
        expect(mapValues(1, (value: number) => value + 1)).toStrictEqual(2);
    });

    it('should map key-values as itself if no mapping is provided', () => {
        expect(mapValues('a', {b: 'c'})).toBe('a');
    });
});
