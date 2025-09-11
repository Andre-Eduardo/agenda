import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListEmployeePositionDto} from '../list-employee-position.dto';

describe('A ListEmployeePositionInput', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            name: 'Manager',
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'Admin',
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'Maid',
            pagination: {
                cursor: 'f7c43409-48eb-482b-b359-a540c7bb60ca',
                limit: 10,
                sort: {
                    name: 'asc',
                },
            },
        },
    ])(`should accept valid payloads`, (payload) => {
        expect(ListEmployeePositionDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 1,
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
    ])('should reject invalid payloads', (payload, expectedIssue) => {
        expect(ListEmployeePositionDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    issues: expect.arrayContaining([expect.objectContaining(expectedIssue)]),
                }),
            })
        );
    });
});
