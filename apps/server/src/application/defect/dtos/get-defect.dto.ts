import {z} from 'zod';
import {DefectId} from '../../../domain/defect/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getDefectSchema = z.object({
    id: entityId(DefectId),
});

export class GetDefectDto extends createZodDto(getDefectSchema) {}
