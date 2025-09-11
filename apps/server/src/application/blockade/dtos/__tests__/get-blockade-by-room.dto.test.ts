import {ZodIssueCode} from 'zod';
import {RoomId} from '../../../../domain/room/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {GetBlockadeByRoomDto} from '../get-blockade-by-room.dto';

describe('A GetBlockByRoomDto', () => {
    it.each([
        {
            roomId: RoomId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(GetBlockadeByRoomDto.schema.safeParse(payload)).toEqual(
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
        const result = GetBlockadeByRoomDto.schema.safeParse(payload);

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
