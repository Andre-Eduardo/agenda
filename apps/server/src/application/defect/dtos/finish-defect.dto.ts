import {z} from 'zod';
import {DefectId} from '../../../domain/defect/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const finishDefectSchema = z.object({
    id: entityId(DefectId),
});

export class FinishDefectDto extends createZodDto(finishDefectSchema) {}
