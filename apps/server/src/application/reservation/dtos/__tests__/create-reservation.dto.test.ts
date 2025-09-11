import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {PersonId} from '../../../../domain/person/entities';
import {RoomId} from '../../../../domain/room/entities';
import {RoomCategoryId} from '../../../../domain/room-category/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateReservationDto} from '../index';

describe('A CreateReservationDto', () => {
    const futureDate = new Date(new Date().getTime() + 5 * 60000).toISOString();

    it.each([
        {
            companyId: CompanyId.generate().toString(),
            roomId: RoomId.generate().toString(),
            checkIn: futureDate,
            bookedFor: PersonId.generate().toString(),
            note: 'note',
        },
        {
            companyId: CompanyId.generate().toString(),
            roomCategoryId: RoomCategoryId.generate().toString(),
            checkIn: futureDate,
            bookedFor: PersonId.generate().toString(),
            deposits: [{amount: 100, paymentMethodId: PaymentMethodId.generate().toString()}],
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateReservationDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    const pastDate = new Date(new Date().getTime() - 5 * 60000).toISOString();

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 1,
                roomId: RoomId.generate().toString(),
                checkIn: futureDate,
                bookedFor: PersonId.generate().toString(),
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: 'foo',
                checkIn: futureDate,
                bookedFor: PersonId.generate().toString(),
            },
            {
                code: ZodIssueCode.custom,
                path: ['roomId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomCategoryId: RoomCategoryId.generate().toString(),
                checkIn: pastDate,
                bookedFor: PersonId.generate().toString(),
            },
            {
                code: ZodIssueCode.custom,
                path: ['checkIn'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: RoomId.generate().toString(),
                checkIn: futureDate,
                bookedFor: PersonId.generate().toString(),
                note: 3,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['note'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomCategoryId: RoomCategoryId.generate().toString(),
                checkIn: futureDate,
                bookedFor: PersonId.generate().toString(),
                deposits: [{amount: -1, paymentMethodId: PaymentMethodId.generate().toString()}],
            },
            {
                code: ZodIssueCode.too_small,
                path: ['deposits', 0, 'amount'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreateReservationDto.schema.safeParse(payload);

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
