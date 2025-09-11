import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {DefectTypeId} from '../../../../domain/defect-type/entities';
import {RoomId} from '../../../../domain/room/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateDefectDto} from '../create-defect.dto';

describe('A CreateDefectDto', () => {
    it.each<Record<string, unknown>>([
        {
            companyId: CompanyId.generate().toString(),
            note: 'The door is broken',
            roomId: RoomId.generate().toString(),
            defectTypeId: DefectTypeId.generate().toString(),
        },
        {
            companyId: CompanyId.generate().toString(),
            roomId: RoomId.generate().toString(),
            defectTypeId: DefectTypeId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateDefectDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 1,
                note: 'The door is broken',
                roomId: RoomId.generate().toString(),
                defectTypeId: DefectTypeId.generate().toString(),
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: 'foo',
                note: 'The door is broken',
                roomId: RoomId.generate().toString(),
                defectTypeId: DefectTypeId.generate().toString(),
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                note: 'The door is broken',
                roomId: 1,
                defectTypeId: DefectTypeId.generate().toString(),
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['roomId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                note: 'The door is broken',
                roomId: 'foo',
                defectTypeId: DefectTypeId.generate().toString(),
            },
            {
                code: ZodIssueCode.custom,
                path: ['roomId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                note: 'The door is broken',
                roomId: RoomId.generate().toString(),
                defectTypeId: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['defectTypeId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                note: 'The door is broken',
                roomId: RoomId.generate().toString(),
                defectTypeId: 'foo',
            },
            {
                code: ZodIssueCode.custom,
                path: ['defectTypeId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                note: '',
                roomId: RoomId.generate().toString(),
                defectTypeId: DefectTypeId.generate().toString(),
            },
            {
                code: ZodIssueCode.too_small,
                path: ['note'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                note: 123,
                roomId: RoomId.generate().toString(),
                defectTypeId: DefectTypeId.generate().toString(),
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['note'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreateDefectDto.schema.safeParse(payload);

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
