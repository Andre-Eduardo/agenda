import {ZodIssueCode} from 'zod';
import type {ExpectedIssue} from '../../../__tests__/zod.utils';
import {datetime} from '../datetime.schema';

describe('A datetime schema', () => {
    it.each([
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00.123Z',
        new Date(1000).toISOString(),
        new Date('1/10/23').toISOString(),
    ])('should accept valid payloads', (payload) => {
        expect(datetime.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[unknown, ExpectedIssue]>([
        [
            '2024-01-01',
            {
                code: ZodIssueCode.invalid_string,
            },
        ],
        [
            123,
            {
                code: ZodIssueCode.invalid_type,
            },
        ],
        [
            new Date('1/10/23'),
            {
                code: ZodIssueCode.invalid_type,
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = datetime.safeParse(payload);

        expect(result.success).toEqual(false);

        if (result.success) return;

        expect(result.error.errors).toEqual([
            expect.objectContaining({
                code: expected.code,
                path: [],
            }),
        ]);
    });
});
