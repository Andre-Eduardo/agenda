import {ZodIssueCode} from 'zod';
import {RoomId} from '../../../../domain/room/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {DeleteRoomDto} from '../delete-room.dto';

describe('A DeleteClientDto', () => {
    it.each([
        {
            id: RoomId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(DeleteRoomDto.schema.safeParse(payload)).toEqual(
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
        const result = DeleteRoomDto.schema.safeParse(payload);

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
