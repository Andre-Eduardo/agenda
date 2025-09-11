import {ZodIssueCode} from 'zod';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {RejectInspectionInputDto} from '../reject-inspection.dto';

describe('A RejectInspectionInputDto', () => {
    it.each([
        {
            finishedById: UserId.generate().toString(),
            note: 'note',
        },
        {
            finishedById: UserId.generate().toString(),
            note: null,
        },
    ])('should accept valid payloads', (payload) => {
        expect(RejectInspectionInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                finishedById: 1,
                note: null,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['finishedById'],
            },
        ],
        [
            {
                finishedById: 'aaa',
                note: null,
            },
            {
                code: ZodIssueCode.custom,
                path: ['finishedById'],
            },
        ],
        [
            {
                finishedById: UserId.generate().toString(),
                note: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['note'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = RejectInspectionInputDto.schema.safeParse(payload);

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
