import type {z} from 'zod';
import {DefectId} from '../../../domain/defect/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createDefectSchema} from './create-defect.dto';

const updateDefectInputSchema = createDefectSchema.omit({companyId: true}).partial();

export class UpdateDefectInputDto extends createZodDto(updateDefectInputSchema) {}

export const updateDefectSchema = updateDefectInputSchema.extend({
    id: entityId(DefectId),
});

export type UpdateDefectDto = z.infer<typeof updateDefectSchema>;
