import {ZodIssueCode} from 'zod';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {UpdateEmployeePositionInputDto} from '../update-employee-position.dto';

describe('A UpdateEmployeePositionInput', () => {
    it.each([
        {
            name: 'Manager',
        },
        {
            name: 'Admin',
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateEmployeePositionInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                name: '',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = UpdateEmployeePositionInputDto.schema.safeParse(payload);

        expect(result.success).toBe(false);

        if (result.success) return;

        expect(result.error.errors).toEqual([
            expect.objectContaining({
                code: expected.code,
                path: expected.path,
                ...(expected.keys && {keys: expected.keys}),
            }),
        ]);
    });
});
