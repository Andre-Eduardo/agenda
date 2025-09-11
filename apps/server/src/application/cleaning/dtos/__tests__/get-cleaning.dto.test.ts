import {ZodIssueCode} from 'zod';
import {RoomStatusId} from '../../../../domain/room-status/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {GetCleaningDto} from '../get-cleaning.dto';

describe('A GetCleaningDto', () => {
    it.each([
        {
            id: RoomStatusId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(GetCleaningDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                id: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['id'],
            },
        ],
        [
            {
                id: 'foo',
            },
            {
                code: ZodIssueCode.custom,
                path: ['id'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = GetCleaningDto.schema.safeParse(payload);

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
