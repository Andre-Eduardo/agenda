import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import type {DefectSortOptions} from '../../../domain/defect/defect.repository';
import {DefectTypeId} from '../../../domain/defect-type/entities';
import {RoomId} from '../../../domain/room/entities';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';

const listDefectSchema = z.object({
    companyId: entityId(CompanyId),
    note: z.string().min(1).optional().openapi({description: 'The note to search for'}),
    roomId: entityId(RoomId).optional().openapi({description: 'The room to search for'}),
    defectTypeId: entityId(DefectTypeId).optional().openapi({description: 'The defect type to search for'}),
    createdById: entityId(UserId).optional().openapi({description: 'The creator to search for'}),
    createdAt: z.date().optional().openapi({description: 'The creation date to search for'}),
    finishedById: entityId(UserId).optional().openapi({description: 'The finisher to search for'}),
    finishedAt: z.date().optional().openapi({description: 'The finish date to search for'}),
    pagination: pagination(<DefectSortOptions>['note', 'finishedAt', 'createdAt', 'updatedAt']),
});

export class ListDefectDto extends createZodDto(listDefectSchema) {}
