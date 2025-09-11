import type {z} from 'zod';
import {DefectTypeId} from '../../../domain/defect-type/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createDefectTypeSchema} from './create-defect-type.dto';

const updateDefectTypeInputSchema = createDefectTypeSchema.partial();

export class UpdateDefectTypeInputDto extends createZodDto(updateDefectTypeInputSchema) {}

export const updateDefectTypeSchema = updateDefectTypeInputSchema.extend({
    id: entityId(DefectTypeId),
});

export type UpdateDefectTypeDto = z.infer<typeof updateDefectTypeSchema>;
