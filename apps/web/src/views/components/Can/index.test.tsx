import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Can} from '.';

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

describe('Can', () => {
    beforeEach(() => {
        permissionsQuery.mockReset();
    });

    describe('when the permission is granted', () => {
        beforeEach(() => {
            permissionsQuery.mockReturnValue(loaded('package-plan:create'));
        });

        it('renders its children', () => {
            const html = renderToStaticMarkup(
                <Can has="package-plan:create">
                    <button type="button">Novo pacote</button>
                </Can>
            );

            expect(html).toBe('<button type="button">Novo pacote</button>');
        });

        it('renders `granted` when both `granted` and `denied` are given', () => {
            const html = renderToStaticMarkup(<Can has="package-plan:create" granted="yes" denied="no" />);

            expect(html).toBe('yes');
        });

        it('passes true to a render-prop child', () => {
            const html = renderToStaticMarkup(
                <Can has="package-plan:create">
                    {(allowed) => (
                        <button type="button" disabled={!allowed}>
                            Salvar
                        </button>
                    )}
                </Can>
            );

            expect(html).toBe('<button type="button">Salvar</button>');
        });
    });

    describe('when the permission is not granted', () => {
        beforeEach(() => {
            permissionsQuery.mockReturnValue(loaded('patient:view'));
        });

        it('renders nothing for children', () => {
            const html = renderToStaticMarkup(
                <Can has="package-plan:create">
                    <button type="button">Novo pacote</button>
                </Can>
            );

            expect(html).toBe('');
        });

        it('renders `denied`', () => {
            const html = renderToStaticMarkup(<Can has="package-plan:create" granted="yes" denied="no" />);

            expect(html).toBe('no');
        });

        it('passes false to a render-prop child', () => {
            const html = renderToStaticMarkup(
                <Can has="package-plan:create">
                    {(allowed) => (
                        <button type="button" disabled={!allowed}>
                            Salvar
                        </button>
                    )}
                </Can>
            );

            expect(html).toBe('<button type="button" disabled="">Salvar</button>');
        });
    });

    describe('with hasAny and hasAll', () => {
        it('renders children when hasAny matches one permission', () => {
            permissionsQuery.mockReturnValue(loaded('patient:view'));

            const html = renderToStaticMarkup(
                <Can hasAny={['patient:update', 'patient:view']}>
                    <span>ok</span>
                </Can>
            );

            expect(html).toBe('<span>ok</span>');
        });

        it('hides children when hasAll misses one permission', () => {
            permissionsQuery.mockReturnValue(loaded('patient:view'));

            const html = renderToStaticMarkup(
                <Can hasAll={['patient:view', 'patient:update']}>
                    <span>ok</span>
                </Can>
            );

            expect(html).toBe('');
        });
    });

    describe('without a restriction', () => {
        it('renders children without waiting for permissions', () => {
            permissionsQuery.mockReturnValue(loading);

            const html = renderToStaticMarkup(
                <Can>
                    <span>open</span>
                </Can>
            );

            expect(html).toBe('<span>open</span>');
        });
    });

    describe('while permissions load', () => {
        beforeEach(() => {
            permissionsQuery.mockReturnValue(loading);
        });

        it('does not render the gated children', () => {
            const html = renderToStaticMarkup(
                <Can has="package-plan:create">
                    <button type="button">Novo pacote</button>
                </Can>
            );

            expect(html).toBe('');
        });

        it('renders `loading` instead of `denied` or `granted`', () => {
            const html = renderToStaticMarkup(
                <Can has="package-plan:create" granted="yes" denied="no" loading="wait" />
            );

            expect(html).toBe('wait');
        });

        it('passes false to a render-prop child', () => {
            const html = renderToStaticMarkup(
                <Can has="package-plan:create">
                    {(allowed) => (
                        <button type="button" disabled={!allowed}>
                            Salvar
                        </button>
                    )}
                </Can>
            );

            expect(html).toBe('<button type="button" disabled="">Salvar</button>');
        });
    });

    describe('when permissions fail to load', () => {
        beforeEach(() => {
            permissionsQuery.mockReturnValue(failed);
        });

        it('does not render the gated children', () => {
            const html = renderToStaticMarkup(
                <Can has="package-plan:create">
                    <button type="button">Novo pacote</button>
                </Can>
            );

            expect(html).toBe('');
        });

        it('renders `denied`, not `loading`', () => {
            const html = renderToStaticMarkup(
                <Can has="package-plan:create" granted="yes" denied="no" loading="wait" />
            );

            expect(html).toBe('no');
        });
    });
});
