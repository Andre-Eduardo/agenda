import {ZodIssueCode} from 'zod';
import {EmployeePositionId} from '../../../../domain/employee-position/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {UpdateEmployeeInputDto} from '../update-employee.dto';

describe('A UpdateEmployeeInput', () => {
    it.each([
        {
            name: 'Name 1',
        },
        {
            name: 'Name 1',
            phone: '61999999999',
        },
        {
            name: 'Name 1',
            documentId: '15785065178',
        },
        {
            documentId: '15785065178',
        },
        {
            gender: 'MALE',
            positionId: EmployeePositionId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateEmployeeInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                name: '',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
        [
            {
                documentId: '157..850.651-7',
            },
            {code: ZodIssueCode.custom, path: ['documentId']},
        ],
        [
            {
                gender: 'homem',
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['gender'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = UpdateEmployeeInputDto.schema.safeParse(payload);

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
