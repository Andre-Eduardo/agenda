import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {Procedure, ProcedureColor, ProcedureId, ProcedureModality} from '@domain/procedure/procedure.entity';

export const procedureIdSchema = entityId(ProcedureId);

export const procedureOverridesSchema = z.object({
    color: z.nativeEnum(ProcedureColor),
    priceInCents: z.number().int().min(0).max(2_147_483_647),
    modality: z.nativeEnum(ProcedureModality),
});

const createProcedureSchema = procedureOverridesSchema.extend({
    name: z.string().trim().min(1).max(120),
    durationMinutes: z.number().int().min(1).max(720),
});

const updateProcedureSchema = createProcedureSchema.extend({active: z.boolean()});

export class CreateProcedureDto extends createZodDto(createProcedureSchema) {}
export class UpdateProcedureDto extends createZodDto(updateProcedureSchema) {}

@ApiSchema({name: 'Procedure'})
export class ProcedureDto {
    @ApiProperty({format: 'uuid'})
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    durationMinutes: number;

    @ApiProperty({enum: ProcedureColor, enumName: 'ProcedureColor'})
    color: ProcedureColor;

    @ApiProperty({description: 'Price in BRL cents'})
    priceInCents: number;

    @ApiProperty({enum: ProcedureModality, enumName: 'ProcedureModality'})
    modality: ProcedureModality;

    @ApiProperty()
    active: boolean;

    constructor(procedure: Procedure) {
        this.id = procedure.id.toString();
        this.name = procedure.name;
        this.durationMinutes = procedure.durationMinutes;
        this.color = procedure.color;
        this.priceInCents = procedure.priceInCents;
        this.modality = procedure.modality;
        this.active = procedure.active;
    }
}
