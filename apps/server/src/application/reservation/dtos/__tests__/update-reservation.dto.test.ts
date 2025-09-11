import {ZodIssueCode} from 'zod';
import {PersonId} from '../../../../domain/person/entities';
import {RoomId} from '../../../../domain/room/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {UpdateReservationInputDto} from '../update-reservation.dto';

describe('A UpdateReservationInputDto', () => {
    const futureDate = new Date(new Date().getTime() + 5 * 60000).toISOString();

    it.each([
        {
            roomId: RoomId.generate().toString(),
            bookedFor: PersonId.generate().toString(),
            note: 'note',
        },
        {
            roomId: RoomId.generate().toString(),
            checkIn: futureDate,
            bookedFor: PersonId.generate().toString(),
            note: 'note',
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateReservationInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    const pastDate = new Date(new Date().getTime() - 5 * 60000).toISOString();

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                roomId: RoomId.generate().toString(),
                checkIn: pastDate,
            },
            {
                code: ZodIssueCode.custom,
                path: ['checkIn'],
            },
        ],
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
                note: 3,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['note'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = UpdateReservationInputDto.schema.safeParse(payload);

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
