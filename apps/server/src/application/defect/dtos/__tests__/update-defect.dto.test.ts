import {ZodIssueCode} from 'zod';
import {DefectTypeId} from '../../../../domain/defect-type/entities';
import {RoomId} from '../../../../domain/room/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {UpdateDefectInputDto} from '../update-defect.dto';

describe('A UpdateDefectInputDto', () => {
    it.each([
        {
            note: 'The door is broken',
            roomId: RoomId.generate().toString(),
            defectTypeId: DefectTypeId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateDefectInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                roomId: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['roomId'],
            },
        ],
        [
            {
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
                note: 'The door is broken',
                defectTypeId: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['defectTypeId'],
            },
        ],
        [
            {
                defectTypeId: 'foo',
            },
            {
                code: ZodIssueCode.custom,
                path: ['defectTypeId'],
            },
        ],
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
                note: 123,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['note'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = UpdateDefectInputDto.schema.safeParse(payload);

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
