export enum GlobalRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    /** Suporte global: entra em qualquer clínica sem vínculo de funcionário, só leitura e sem dados clínicos. */
    SUPPORT = 'SUPPORT',
    OWNER = 'OWNER',
    NONE = 'NONE',
}

const CROSS_CLINIC_ROLES: ReadonlySet<GlobalRole> = new Set([GlobalRole.SUPER_ADMIN, GlobalRole.SUPPORT]);

/** Papéis globais que podem entrar em qualquer clínica pelo suporte, sem ser funcionário dela. */
export function canAccessAllClinics(role: GlobalRole): boolean {
    return CROSS_CLINIC_ROLES.has(role);
}
