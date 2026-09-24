import {Request} from 'express';

/** Uses only route identifiers, never request bodies or query parameters. */
export function auditResourceId(params: Request['params']): string | null {
    return (
        Object.entries(params)
            .filter(([key]) => key === 'id' || (key.endsWith('Id') && key !== 'clinicId'))
            .at(-1)?.[1] ?? null
    );
}
