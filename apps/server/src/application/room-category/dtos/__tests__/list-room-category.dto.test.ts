import {ZodIssueCode} from 'zod';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListRoomCategoryDto} from '../list-room-category.dto';

describe('A ListRoomCategoryDto', () => {
    it.each([
        {
            name: 'Lush',
            acronym: 'lsh',
            companyId: '60f4b3b3-0b3b-4b7b-8b7b-0b3b0b3b0b3b',
            pagination: {
                limit: 10,
            },
        },
        {
            name: 'VANDAL',
            acronym: 'VD',
            companyId: '60f4b3b3-0b3b-4b7b-8b7b-0b3b0b3b0b3b',
            pagination: {
                cursor: 'f7c43409-48eb-482b-b359-a540c7bb60ca',
                limit: 10,
                sort: {
                    name: 'asc',
                },
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListRoomCategoryDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                name: 1,
                acronym: 'CT',
                companyId: '60f4b3b3-0b3b-4b7b-8b7b-0b3b0b3b0b3b',
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
    ])('should reject invalid payloads', (payload, expectedIssue) => {
        expect(ListRoomCategoryDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    issues: expect.arrayContaining([expect.objectContaining(expectedIssue)]),
                }),
            })
        );
    });
});
