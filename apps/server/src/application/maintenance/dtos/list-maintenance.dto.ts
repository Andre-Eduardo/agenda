import {z} from 'zod';
import type {MaintenanceSortOptions} from '../../../domain/maintenance/maintenance.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {pagination} from '../../@shared/validation/schemas';
import {listRoomStatusSchema} from '../../room-status/dtos';

const listMaintenanceDto = listRoomStatusSchema.extend({
    note: z.string().optional().openapi({description: 'The note to search for'}),
    pagination: pagination(<MaintenanceSortOptions>['note', 'createdAt', 'finishedAt']),
});

export class ListMaintenanceDto extends createZodDto(listMaintenanceDto) {}
