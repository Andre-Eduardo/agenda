import {ZodIssueCode} from 'zod';
import {RoomPermission, ProductPermission} from '../../../../domain/auth';
import {CompanyId} from '../../../../domain/company/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateEmployeePositionDto} from '../create-employee-position.dto';

describe('A CreateEmployeePositionDto', () => {
    const companyId = CompanyId.generate().toString();

    it.each([
        {
            companyId,
            name: 'Manager',
            permissions: [RoomPermission.VIEW, ProductPermission.VIEW],
        },
        {
            companyId,
            name: 'Admin',
            permissions: [RoomPermission.VIEW],
        },
        {
            companyId,
            name: 'Maid',
            permissions: [],
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateEmployeePositionDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId,
                name: 'Manager',
                permissions: [true],
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['permissions', 0],
            },
        ],
        [
            {
                companyId,
                name: 1,
                permissions: [],
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
        [
            {
                companyId: 'foo',
                name: 'Manager',
                permissions: [],
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
    ])(`should reject invalid payloads`, (payload, expected) => {
        const result = CreateEmployeePositionDto.schema.safeParse(payload);

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
