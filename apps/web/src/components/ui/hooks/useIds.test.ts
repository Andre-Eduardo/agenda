import {renderHook} from '@testing-library/react';
import {useIds} from './useIds';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useId: jest.fn().mockReturnValueOnce('random-id'),
}));

describe('useIds', () => {
    it('should return an array of IDs', () => {
        const {result} = renderHook(() =>
            useIds('id1', 'id2', undefined, {id: 'id3', when: true}, {id: 'id4', when: false})
        );

        expect(result.current).toEqual(['random-id-id1', 'random-id-id2', undefined, 'random-id-id3', undefined]);
    });
});
