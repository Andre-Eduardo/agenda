import {ZodIssueCode} from 'zod';
import {DefectId} from '../../../../domain/defect/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {UpdateMaintenanceInputDto} from '../update-maintenance.dto';

describe('A UpdateMaintenanceDto', () => {
    it.each([
        {
            note: 'Note',
            defects: [DefectId.generate().toString()],
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateMaintenanceInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                note: '',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['note'],
            },
        ],
        [
            {
                defects: [],
            },
            {
                code: ZodIssueCode.too_small,
                path: ['defects'],
            },
        ],
        [
            {
                defects: [null],
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['defects', 0],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = UpdateMaintenanceInputDto.schema.safeParse(payload);

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
