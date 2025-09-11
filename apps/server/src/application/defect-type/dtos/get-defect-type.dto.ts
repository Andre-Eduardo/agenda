import {z} from 'zod';
import {DefectTypeId} from '../../../domain/defect-type/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getDefectTypeSchema = z.object({
    id: entityId(DefectTypeId),
});

export class GetDefectTypeDto extends createZodDto(getDefectTypeSchema) {}
