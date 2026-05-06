import {joinIds} from './aria';

describe('joinIds', () => {
    it('should join valid IDs', () => {
        expect(joinIds('id', undefined, '', null, 'another-id')).toBe('id another-id');

        expect(joinIds(undefined, '', null)).toBe(undefined);
    });
});
