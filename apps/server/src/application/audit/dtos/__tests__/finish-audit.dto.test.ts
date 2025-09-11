import {ZodIssueCode} from 'zod';
import {RoomId} from '../../../../domain/room/entities';
import {RoomState} from '../../../../domain/room/models/room-state';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {FinishAuditInputDto} from '../finish-audit.dto';

describe('A FinishAuditDto', () => {
    it.each([
        {
            roomId: RoomId.generate().toString(),
            note: 'Audit took longer than expected',
            nextRoomState: RoomState.DIRTY,
        },
        {
            roomId: RoomId.generate().toString(),
            nextRoomState: RoomState.VACANT,
        },
    ])(`should accept valid payloads`, (payload) => {
        expect(FinishAuditInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                note: '',
                nextRoomState: RoomState.VACANT,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['note'],
            },
        ],
        [
            {
                note: 1,
                nextRoomState: RoomState.VACANT,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['note'],
            },
        ],
        [
            {
                note: 'Audit took longer than expected',
                nextRoomState: 'foo',
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['nextRoomState'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = FinishAuditInputDto.schema.safeParse(payload);

        expect(result.success).toBe(false);

        if (result.success) {
            return;
        }

        expect(result.error.errors).toEqual([
            expect.objectContaining({
                code: expected.code,
                path: expected.path,
                ...(expected.keys && {keys: expected.keys}),
            }),
        ]);
    });
});
