import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import type {ModuleType} from '@domain/clinic-license/models';

export const setModuleMembersSchema = z.object({
    /** Lista completa: quem não estiver aqui perde o pacote. */
    clinicMemberIds: z.array(z.string().uuid()),
    /** Obrigatório quando a lista passa das vagas contratadas e o plano permite extra. */
    acceptExtraCharge: z.boolean().default(false),
});

export class SetModuleMembersInputDto extends createZodDto(setModuleMembersSchema) {}

export type SetModuleMembersDto = SetModuleMembersInputDto & {moduleType: ModuleType};
