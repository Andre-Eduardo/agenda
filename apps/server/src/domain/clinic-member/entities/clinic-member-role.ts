/**
 * Roles definem o TETO de capacidade. As permissões granulares por paciente
 * e por documento vivem em ClinicPatientAccess e DocumentPermission.
 */
export enum ClinicMemberRole {
    /** Acesso total. Gerencia membros e permissões. Único membro inicial em isPersonalClinic. */
    OWNER = 'OWNER',
    /** Gerencia membros (exceto OWNER) e permissões. Não pode se auto-promover a OWNER. */
    ADMIN = 'ADMIN',
    /** Profissional de saúde. Cria prontuários, evoluções. Exige Professional vinculado. */
    PROFESSIONAL = 'PROFESSIONAL',
    /** Cadastra pacientes, agenda, faz upload. Acesso a dados clínicos depende de permissão. */
    SECRETARY = 'SECRETARY',
    /** Somente leitura onde tiver permissão explícita. */
    VIEWER = 'VIEWER',
}
