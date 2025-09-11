import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {PersonId} from '../../../../domain/person/entities';
import {RoomId} from '../../../../domain/room/entities';
import {RoomCategoryId} from '../../../../domain/room-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListReservationDto} from '../list-reservation.dto';

describe('A ListReservationDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            roomId: RoomId.generate().toString(),
            checkIn: {
                from: new Date(1000).toISOString(),
                to: new Date(1500).toISOString(),
            },
            bookedBy: UserId.generate().toString(),
            bookedFor: PersonId.generate().toString(),
            noShow: false,
            pagination: {limit: 10},
        },
        {
            companyId: CompanyId.generate().toString(),
            roomCategoryId: RoomCategoryId.generate().toString(),
            checkIn: {
                from: new Date(1000).toISOString(),
                to: new Date(1500).toISOString(),
            },
            canceledAt: {
                from: new Date(2000).toISOString(),
                to: new Date(3000).toISOString(),
            },
            canceledBy: UserId.generate().toString(),
            noShow: false,
            pagination: {
                cursor: 'f7c43409-48eb-482b-b359-a540c7bb60ca',
                limit: 10,
                sort: {
                    canceledAt: 'asc',
                },
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            canceledAt: null,
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            canceledAt: undefined,
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            canceledAt: '',
            pagination: {
                limit: 10,
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListReservationDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: RoomId.generate().toString(),
                checkIn: 3,
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['checkIn'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                canceledAt: 'a',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['canceledAt'],
            },
        ],
    ])('should reject invalid payloads', (payload, expectedIssue) => {
        expect(ListReservationDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    issues: expect.arrayContaining([expect.objectContaining(expectedIssue)]),
                }),
            })
        );
    });
});
