import {ZodIssueCode} from 'zod';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {UpdateDefectTypeInputDto} from '../update-defect-type.dto';

describe('A UpdateDefectTypeInputDto', () => {
    it.each([
        {
            name: 'Name 1',
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateDefectTypeInputDto.schema.safeParse(payload)).toEqual(
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
        const result = UpdateDefectTypeInputDto.schema.safeParse(payload);

        expect(result.success).toEqual(false);

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
