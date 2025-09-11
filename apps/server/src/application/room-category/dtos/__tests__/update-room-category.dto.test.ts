import {ZodIssueCode} from 'zod';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {UpdateRoomCategoryInputDto} from '../index';

describe('A UpdateCategoryInput', () => {
    it.each([
        {
            name: 'LUSH HIDRO',
            acronym: 'LH',
            guestCount: 10,
        },
        {
            name: 'Cat',
            acronym: 'C',
            guestCount: 1,
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateRoomCategoryInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                name: '',
                acronym: 'CT',
                guestCount: 10,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
        [
            {
                name: 'TULUM',
                acronym: '',
                guestCount: 10,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['acronym'],
            },
        ],
        [
            {
                name: 'OSLO',
                acronym: 'OSO',
                guestCount: 10,
            },
            {
                code: ZodIssueCode.too_big,
                path: ['acronym'],
            },
        ],
        [
            {
                name: 'CHICAGO',
                acronym: 'CH',
                guestCount: -1,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['guestCount'],
            },
        ],
        [
            {
                name: 'DEEP OCEAN',
                acronym: 'DO',
                guestCount: 0,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['guestCount'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = UpdateRoomCategoryInputDto.schema.safeParse(payload);

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
