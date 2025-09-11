import {ZodIssueCode} from 'zod';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {UpdateProductInputDto} from '../update-product.dto';

describe('A UpdateProductInputDto', () => {
    it.each([
        {
            name: 'Name 1',
            code: 1,
            price: 100,
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateProductInputDto.schema.safeParse(payload)).toEqual(
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
        const result = UpdateProductInputDto.schema.safeParse(payload);

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
