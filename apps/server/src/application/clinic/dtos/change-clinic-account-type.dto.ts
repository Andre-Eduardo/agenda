import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {ClinicAccountType} from '@domain/clinic/entities';

export const changeClinicAccountTypeSchema = z.object({
    accountType: z.nativeEnum(ClinicAccountType),
    /**
     * Obrigatório ao passar para CLINIC: o dono confirma que a equipe que entrar poderá
     * receber acesso aos pacientes da conta (LGPD). Fica na trilha de auditoria.
     */
    confirmTeamAccess: z.boolean().default(false),
});

export class ChangeClinicAccountTypeDto extends createZodDto(changeClinicAccountTypeSchema) {}
