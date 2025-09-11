import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import type {DeepCleaningSortOptions} from '../../../domain/deep-cleaning/deep-cleaning.repository';
import {DeepCleaningEndReasonType} from '../../../domain/deep-cleaning/entities';
import {RoomId} from '../../../domain/room/entities';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';
import {listRoomStatusSchema} from '../../room-status/dtos';

const listDeepCleaningDto = listRoomStatusSchema.extend({
    companyId: entityId(CompanyId),
    roomId: entityId(RoomId).optional().openapi({description: 'The room to search for'}),
    startedById: entityId(UserId).optional().openapi({description: 'The starter to search for'}),
    finishedById: entityId(UserId).optional().openapi({description: 'The finisher to searching for'}),
    endReason: z
        .nativeEnum(DeepCleaningEndReasonType)
        .optional()
        .openapi({description: 'The end reason to search for', enumName: 'DeepCleaningEndReasonType'}),
    pagination: pagination(<DeepCleaningSortOptions>['endReason', 'createdAt', 'finishedAt']),
});

export class ListDeepCleaningDto extends createZodDto(listDeepCleaningDto) {}
