import {z} from 'zod';
import type {BlockadeSortOptions} from '../../../domain/blockade/blockade.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {pagination} from '../../@shared/validation/schemas';
import {listRoomStatusSchema} from '../../room-status/dtos';

const listBlockadeDto = listRoomStatusSchema.extend({
    note: z.string().optional().openapi({description: 'The note to search for'}),
    pagination: pagination(<BlockadeSortOptions>['note', 'createdAt', 'finishedAt']),
});

export class ListBlockadeDto extends createZodDto(listBlockadeDto) {}
