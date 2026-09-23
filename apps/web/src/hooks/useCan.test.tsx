import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {useCanState, type CanState, type UseCanProps} from './useCan';

interface QueryResult {
    data?: {permissions: string[]};
    isPending: boolean;
    isError: boolean;
}

const permissionsQuery = vi.hoisted(() => vi.fn<(options: unknown) => QueryResult>());

vi.mock('@agenda-app/client', () => ({
    useGetCurrentClinicMemberPermissions: permissionsQuery,
}));

const loaded = (...permissions: string[]): QueryResult => ({data: {permissions}, isPending: false, isError: false});
const loading: QueryResult = {isPending: true, isError: false};
const failed: QueryResult = {isPending: false, isError: true};

function stateOf(props?: UseCanProps): CanState {
    let state: CanState | undefined;

    function Probe() {
        state = useCanState(props);

        return null;
    }

    renderToStaticMarkup(<Probe />);

    if (!state) throw new Error('useCanState did not run');

    return state;
}

describe('useCanState', () => {
    beforeEach(() => {
        permissionsQuery.mockReset();
    });

    describe('without a restriction', () => {
        it.each([
            {description: 'no props', props: undefined},
            {description: 'empty props', props: {}},
        ])('allows with $description and does not request permissions', ({props}) => {
            permissionsQuery.mockReturnValue(loading);

            expect(stateOf(props)).toEqual({allowed: true, isLoading: false, isError: false});
            expect(permissionsQuery).toHaveBeenCalledWith({query: expect.objectContaining({enabled: false})});
        });
    });

    describe('with a restriction', () => {
        it('requests permissions and caches them for five minutes', () => {
            permissionsQuery.mockReturnValue(loaded('patient:view'));

            stateOf({has: 'patient:view'});

            expect(permissionsQuery).toHaveBeenCalledWith({query: {enabled: true, staleTime: 5 * 60 * 1000}});
        });

        it.each([
            {description: 'has: granted', props: {has: 'patient:view'}, allowed: true},
            {description: 'has: not granted', props: {has: 'patient:delete'}, allowed: false},
            {description: 'has: empty string', props: {has: ''}, allowed: false},
            {description: 'hasAny: one granted', props: {hasAny: ['patient:delete', 'patient:view']}, allowed: true},
            {description: 'hasAny: none granted', props: {hasAny: ['patient:delete', 'room:create']}, allowed: false},
            {description: 'hasAny: empty list', props: {hasAny: []}, allowed: false},
            {description: 'hasAll: all granted', props: {hasAll: ['patient:view', 'patient:update']}, allowed: true},
            {description: 'hasAll: one missing', props: {hasAll: ['patient:view', 'patient:delete']}, allowed: false},
            {
                description: 'has and hasAll: every condition holds',
                props: {has: 'patient:view', hasAll: ['patient:update']},
                allowed: true,
            },
            {
                description: 'has and hasAll: has holds but hasAll does not',
                props: {has: 'patient:view', hasAll: ['patient:delete']},
                allowed: false,
            },
        ])('$description -> allowed=$allowed', ({props, allowed}) => {
            permissionsQuery.mockReturnValue(loaded('patient:view', 'patient:update'));

            expect(stateOf(props)).toEqual({allowed, isLoading: false, isError: false});
        });

        it('denies a permission the server did not grant to the role', () => {
            permissionsQuery.mockReturnValue(loaded('appointment:view', 'patient:view'));

            expect(stateOf({has: 'financial-report:view'}).allowed).toBe(false);
        });
    });

    describe('loading and error', () => {
        it('denies and reports loading while nothing is cached', () => {
            permissionsQuery.mockReturnValue(loading);

            expect(stateOf({has: 'patient:view'})).toEqual({allowed: false, isLoading: true, isError: false});
        });

        it('denies and reports the error when the request fails with nothing cached', () => {
            permissionsQuery.mockReturnValue(failed);

            expect(stateOf({has: 'patient:view'})).toEqual({allowed: false, isLoading: false, isError: true});
        });

        it('keeps using the last known permissions when a background refetch fails', () => {
            permissionsQuery.mockReturnValue({...loaded('patient:view'), isError: true});

            expect(stateOf({has: 'patient:view'})).toEqual({allowed: true, isLoading: false, isError: false});
            expect(stateOf({has: 'patient:delete'})).toEqual({allowed: false, isLoading: false, isError: false});
        });
    });
});
