import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {DefectId} from '../../../../domain/defect/entities';
import {RoomId} from '../../../../domain/room/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {StartMaintenanceDto} from '../start-maintenance.dto';

describe('A StartMaintenanceDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            roomId: RoomId.generate().toString(),
            note: 'Note',
            defects: [DefectId.generate().toString()],
        },
    ])('should accept valid payloads', (payload) => {
        expect(StartMaintenanceDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 'Company',
                roomId: RoomId.generate().toString(),
                note: 'Note',
                defects: [DefectId.generate().toString()],
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: null,
                roomId: RoomId.generate().toString(),
                note: 'Note',
                defects: [DefectId.generate().toString()],
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: null,
                note: 'Note',
                defects: [DefectId.generate().toString()],
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['roomId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: RoomId.generate().toString(),
                note: '',
                defects: [DefectId.generate().toString()],
            },
            {
                code: ZodIssueCode.too_small,
                path: ['note'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: RoomId.generate().toString(),
                note: 'Note',
                defects: [],
            },
            {
                code: ZodIssueCode.too_small,
                path: ['defects'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: RoomId.generate().toString(),
                note: 'Note',
                defects: [null],
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['defects', 0],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = StartMaintenanceDto.schema.safeParse(payload);

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
