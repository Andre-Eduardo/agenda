import {ZodIssueCode} from 'zod';
import {EmployeePositionId} from '../../../../domain/employee-position/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {DeleteEmployeePositionDto} from '../delete-employee-position.dto';

describe('A DeleteEmployeePositionDto', () => {
    it.each([
        {
            id: EmployeePositionId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(DeleteEmployeePositionDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                id: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['id'],
            },
        ],
        [
            {
                id: 'foo',
            },
            {
                code: ZodIssueCode.custom,
                path: ['id'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = DeleteEmployeePositionDto.schema.safeParse(payload);

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
