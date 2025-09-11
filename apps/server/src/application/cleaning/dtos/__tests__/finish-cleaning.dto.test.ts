import {ZodIssueCode} from 'zod';
import {CleaningEndReasonType} from '../../../../domain/cleaning/entities';
import {RoomStatusId} from '../../../../domain/room-status/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {FinishCleaningInputDto} from '../finish-cleaning.dto';

describe('A FinishCleaningDto', () => {
    it.each([
        {
            id: RoomStatusId.generate().toString(),
            endReason: CleaningEndReasonType.FINISHED,
        },
        {
            id: RoomStatusId.generate().toString(),
            endReason: CleaningEndReasonType.CANCELED,
        },
    ])('should accept valid payloads', (payload) => {
        expect(FinishCleaningInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                id: RoomStatusId.generate().toString(),
                endReason: 'CleaningEndReasonType.CANCELED',
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['endReason'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = FinishCleaningInputDto.schema.safeParse(payload);

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
