import {z} from 'zod';
import {InspectionEndReasonType} from '../../../domain/inspection/entities';
import type {InspectionSortOptions} from '../../../domain/inspection/inspection.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {pagination} from '../../@shared/validation/schemas';
import {listRoomStatusSchema} from '../../room-status/dtos';

const listInspectionSchema = listRoomStatusSchema.extend({
    endReason: z.nativeEnum(InspectionEndReasonType).optional().openapi({
        description: 'The reason for the ending of the inspection to search for',
        enumName: 'InspectionEndReasonType',
    }),
    note: z.string().optional().openapi({description: 'The note to search for'}),
    pagination: pagination(<InspectionSortOptions>['endReason', 'createdAt', 'finishedAt']),
});

export class ListInspectionDto extends createZodDto(listInspectionSchema) {}
