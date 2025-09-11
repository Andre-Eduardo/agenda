import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {DefectTypeId} from '../../../../domain/defect-type/entities';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListDefectDto} from '../list-defect.dto';

describe('A ListDefectDto', () => {
    const companyId = CompanyId.generate().toString();

    it.each([
        {
            companyId,
            note: 'defect',
            roomId: RoomId.generate().toString(),
            defectIds: [DefectTypeId.generate().toString()],
            defectTypeId: DefectTypeId.generate().toString(),
            createdById: UserId.generate().toString(),
            finishedById: UserId.generate().toString(),
            finishedAt: new Date(),
            createdAt: new Date(),
            pagination: {
                limit: 10,
            },
        },
        {
            companyId,
            roomId: RoomId.generate().toString(),
            pagination: {
                limit: 10,
            },
        },
        {
            companyId,
            pagination: {
                limit: 10,
                order: 'asc',
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListDefectDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                note: 123,
                companyId,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['note'],
            },
        ],
        [
            {
                note: '',
                companyId,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.too_small,
                path: ['note'],
            },
        ],
        [
            {
                companyId: 1,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId,
                roomId: 1,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['roomId'],
            },
        ],
        [
            {
                companyId,
                defectTypeId: 1,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['defectTypeId'],
            },
        ],
        [
            {
                companyId,
                createdById: 1,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['createdById'],
            },
        ],
        [
            {
                companyId,
                finishedById: 1,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['finishedById'],
            },
        ],
        [
            {
                companyId,
                finishedAt: 'foo',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['finishedAt'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = ListDefectDto.schema.safeParse(payload);

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
