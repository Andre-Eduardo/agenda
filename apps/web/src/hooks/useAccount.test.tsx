import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {useAccount, type AccountState} from './useAccount';

interface QueryResult {
    data?: {modules: string[]; operationalModules: string[]; accountType: string | null};
    isPending: boolean;
}

const modulesQuery = vi.hoisted(() => vi.fn<(options: unknown) => QueryResult>());

vi.mock('@agenda-app/client', () => ({
    useGetMyModules: modulesQuery,
}));

function account(): AccountState {
    let state: AccountState | undefined;

    function Probe() {
        state = useAccount();

        return null;
    }

    renderToStaticMarkup(<Probe />);

    if (!state) throw new Error('useAccount did not run');

    return state;
}

describe('useAccount', () => {
    beforeEach(() => {
        modulesQuery.mockReset();
    });

    it('reads a clinic account with team and reception', () => {
        modulesQuery.mockReturnValue({
            data: {modules: [], operationalModules: ['TEAM', 'RECEPTION'], accountType: 'CLINIC'},
            isPending: false,
        });

        const state = account();

        expect(state).toMatchObject({accountType: 'CLINIC', isSolo: false, isLoading: false});
        expect(state.hasClinicModule('TEAM')).toBe(true);
        expect(state.hasClinicModule('RECEPTION')).toBe(true);
    });

    it('reads a solo account without clinic modules', () => {
        modulesQuery.mockReturnValue({
            data: {modules: [], operationalModules: [], accountType: 'SOLO'},
            isPending: false,
        });

        const state = account();

        expect(state.isSolo).toBe(true);
        expect(state.hasClinicModule('TEAM')).toBe(false);
    });

    it('denies clinic modules while loading', () => {
        modulesQuery.mockReturnValue({isPending: true});

        const state = account();

        expect(state).toMatchObject({accountType: null, isSolo: false, isLoading: true});
        expect(state.hasClinicModule('TEAM')).toBe(false);
    });
});
