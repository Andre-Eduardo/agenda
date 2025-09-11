import {z} from 'zod';
import type {AuditSortOptions} from '../../../domain/audit/audit.repository';
import {AuditEndReasonType} from '../../../domain/audit/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {pagination} from '../../@shared/validation/schemas';
import {listRoomStatusSchema} from '../../room-status/dtos';

const listAuditSchema = listRoomStatusSchema.extend({
    reason: z.string().optional().openapi({description: 'The reason of the audit to search for'}),
    endReason: z
        .nativeEnum(AuditEndReasonType)
        .optional()
        .openapi({description: 'The end reason to search for', enumName: 'AuditEndReasonType'}),
    note: z.string().optional().openapi({description: 'The note of the audit to search for'}),
    pagination: pagination(<AuditSortOptions>['reason', 'endReason', 'createdAt', 'updatedAt']),
});

export class ListAuditDto extends createZodDto(listAuditSchema) {}
