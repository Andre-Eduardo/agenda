import {ZodIssueCode} from 'zod';
import type {ExpectedIssue} from '../../../__tests__/zod.utils';
import {phone} from '../index';

describe('A phone schema', () => {
    it.each(['12345678901', '(12)945678912', '(12)3456-7890', '(61) 933333333'])(
        'should accept valid payloads',
        (payload) => {
            expect(phone().safeParse(payload)).toEqual(
                expect.objectContaining({
                    success: true,
                })
            );
        }
    );

    it.each<[string, ExpectedIssue]>([
        [
            '12-345-678901',
            {
                code: ZodIssueCode.custom,
            },
        ],
        [
            '(12) 9 345-678901',
            {
                code: ZodIssueCode.custom,
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = phone().safeParse(payload);

        expect(result.success).toEqual(false);

        if (result.success) return;

        expect(result.error.errors).toEqual([
            expect.objectContaining({
                code: expected.code,
                path: [],
                message: 'Invalid phone',
            }),
        ]);
    });
});
