/**
 * Nível de acesso de um membro a um paciente dentro da clínica.
 */
export enum PatientAccessLevel {
    /** Acesso total ao paciente: ver dados, criar e editar registros. */
    FULL = 'FULL',
    /** Pode ver dados clínicos do paciente, mas não pode criar/editar. */
    READ_ONLY = 'READ_ONLY',
    /**
     * Pode cadastrar/atualizar dados básicos e fazer upload, mas não pode ler
     * documentos clínicos. Caso típico: secretária durante o cadastro inicial.
     */
    REGISTER_ONLY = 'REGISTER_ONLY',
    /** Sem acesso. Usado para revogação explícita. */
    NONE = 'NONE',
}
