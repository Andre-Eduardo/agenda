import {ZodIssueCode} from 'zod';
import {ReservationId} from '../../../../domain/reservation/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CancelReservationDto, CancelReservationInputDto} from '../cancel-reservation.dto';

describe('A CancelReservationDto', () => {
    it.each([
        {
            id: ReservationId.generate().toString(),
        },
        {
            id: ReservationId.generate().toString(),
            canceledReason: 'canceled reason',
        },
    ])('should accept valid payloads', (payload) => {
        expect(CancelReservationDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                id: 1,
                canceledReason: 'reason',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['id'],
            },
        ],
        [
            {
                id: 'foo',
                canceledReason: 'reason',
            },
            {
                code: ZodIssueCode.custom,
                path: ['id'],
            },
        ],
        [
            {
                id: ReservationId.generate().toString(),
                canceledReason: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['canceledReason'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CancelReservationDto.schema.safeParse(payload);

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

describe('A UpdateReservationInputDto', () => {
    it.each([
        {
            canceledReason: 'reason',
        },
    ])('should accept valid payloads', (payload) => {
        expect(CancelReservationInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                canceledBy: UserId.generate().toString(),
                canceledReason: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['canceledReason'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CancelReservationInputDto.schema.safeParse(payload);

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
