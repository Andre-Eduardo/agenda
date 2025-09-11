import {ZodIssueCode} from 'zod';
import {DeepCleaningEndReasonType} from '../../../../domain/deep-cleaning/entities';
import {RoomId} from '../../../../domain/room/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {FinishDeepCleaningInputDto} from '../finish-deep-cleaning.dto';

describe('A FinishDeepCleaningDto', () => {
    it.each([
        {
            roomId: RoomId.generate().toString(),
            endReason: DeepCleaningEndReasonType.FINISHED,
        },
        {
            roomId: RoomId.generate().toString(),
            endReason: DeepCleaningEndReasonType.CANCELED,
        },
    ])('should accept valid payloads', (payload) => {
        expect(FinishDeepCleaningInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                roomId: RoomId.generate().toString(),
                endReason: 'DeepCleaningEndReasonType.FINISHED',
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['endReason'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = FinishDeepCleaningInputDto.schema.safeParse(payload);

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
