import {z} from 'zod';
import {DefectId} from '../../../domain/defect/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const deleteDefectSchema = z.object({
    id: entityId(DefectId),
});

export class DeleteDefectDto extends createZodDto(deleteDefectSchema) {}
