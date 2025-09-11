import {ZodIssueCode} from 'zod';
import {RoomId} from '../../../../domain/room/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {GetDeepCleaningByRoomDto} from '../get-deep-cleaning-by-room.dto';

describe('A GetDeepCleaningByRoomDto', () => {
    it.each([
        {
            roomId: RoomId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(GetDeepCleaningByRoomDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                roomId: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['roomId'],
            },
        ],
        [
            {
                roomId: 'foo',
            },
            {
                code: ZodIssueCode.custom,
                path: ['roomId'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = GetDeepCleaningByRoomDto.schema.safeParse(payload);

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
