import {
    ClinicPatientAccessPermission,
    DocumentPermissionPermission,
    PatientCallPermission,
    type Permission,
    ProfessionalAgendaAccessPermission,
} from '@domain/auth/permission';
import {type Clinic, ClinicAccountType} from '@domain/clinic/entities';

/**
 * Módulos de clínica: funcionalidades que só fazem sentido com mais de uma pessoa
 * trabalhando junto. Ao contrário dos pacotes de IA, valem para a clínica inteira
 * (sem vaga por membro) e saem do tipo de conta e das configurações da clínica,
 * não da licença.
 */
export enum OperationalModuleType {
    /** Equipe: membros, papéis, agenda delegada e gestão compartilhada de pacientes. */
    TEAM = 'TEAM',
    /** Recepção e painel de chamada de pacientes. */
    RECEPTION = 'RECEPTION',
}

export type OperationalModuleDefinition = {
    readonly type: OperationalModuleType;
    readonly permissions: ReadonlySet<Permission>;
};

/**
 * Cadastrar membros (`clinic-member:create`) não entra aqui porque a mesma permissão
 * lista os membros, que o autônomo também precisa ver; a conta SOLO barra o segundo
 * membro no próprio serviço de cadastro.
 */
export const allOperationalModules: readonly OperationalModuleDefinition[] = [
    {
        type: OperationalModuleType.TEAM,
        permissions: new Set<Permission>([
            ...Object.values(ProfessionalAgendaAccessPermission),
            ...Object.values(ClinicPatientAccessPermission),
            ...Object.values(DocumentPermissionPermission),
        ]),
    },
    {
        type: OperationalModuleType.RECEPTION,
        permissions: new Set<Permission>(Object.values(PatientCallPermission)),
    },
];

/** Módulos de clínica ligados: equipe só em CLINIC; recepção quando a clínica ligou. */
export function operationalModulesOf(
    clinic: Pick<Clinic, 'accountType' | 'receptionEnabled'>
): Set<OperationalModuleType> {
    const modules = new Set<OperationalModuleType>();

    if (clinic.accountType === ClinicAccountType.CLINIC) modules.add(OperationalModuleType.TEAM);

    if (clinic.receptionEnabled) modules.add(OperationalModuleType.RECEPTION);

    return modules;
}

/** Módulos de clínica que concedem a permissão (vazio quando não é de clínica). */
export function operationalModulesGranting(permission: Permission): OperationalModuleType[] {
    return allOperationalModules.filter((module) => module.permissions.has(permission)).map((module) => module.type);
}
