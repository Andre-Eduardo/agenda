import {z} from 'zod';
import type {CleaningSortOptions} from '../../../domain/cleaning/cleaning.repository';
import {CleaningEndReasonType} from '../../../domain/cleaning/entities';
import {CompanyId} from '../../../domain/company/entities';
import {RoomId} from '../../../domain/room/entities';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';
import {listRoomStatusSchema} from '../../room-status/dtos';

const listCleaningDto = listRoomStatusSchema.extend({
    companyId: entityId(CompanyId),
    roomId: entityId(RoomId).optional().openapi({description: 'The room to search for'}),
    startedById: entityId(UserId).optional().openapi({description: 'The starter to search for'}),
    finishedById: entityId(UserId).optional().openapi({description: 'The finisher to search for'}),
    endReason: z.nativeEnum(CleaningEndReasonType).optional().openapi({
        description: 'The end reason to search for',
        enumName: 'CleaningEndReasonType',
    }),
    pagination: pagination(<CleaningSortOptions>['endReason', 'createdAt', 'finishedAt']),
});

export class ListCleaningDto extends createZodDto(listCleaningDto) {}
