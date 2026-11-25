export enum UserPermission {
    VIEW = 'user:view',
    VIEW_PROFILE = 'user:view-profile',
    CREATE = 'user:create',
    UPDATE = 'user:update',
    CHANGE_PASSWORD = 'user:change-password',
    DELETE = 'user:delete',
}

export enum ProfessionalPermission {
    VIEW = 'professional:view',
    CREATE = 'professional:create',
    UPDATE = 'professional:update',
    DELETE = 'professional:delete',
}

export enum PatientPermission {
    VIEW = 'patient:view',
    CREATE = 'patient:create',
    UPDATE = 'patient:update',
    DELETE = 'patient:delete',
}

export enum AppointmentPermission {
    VIEW = 'appointment:view',
    CREATE = 'appointment:create',
    UPDATE = 'appointment:update',
    CANCEL = 'appointment:cancel',
    DELETE = 'appointment:delete',
    CHECKIN = 'appointment:checkin',
    CALL = 'appointment:call',
}

export enum AppointmentReminderPermission {
    VIEW = 'appointment-reminder:view',
    DISPATCH = 'appointment-reminder:dispatch',
}

export enum ClinicReminderConfigPermission {
    VIEW = 'clinic-reminder-config:view',
    MANAGE = 'clinic-reminder-config:manage',
}

export enum WhatsAppPermission {
    VIEW = 'whatsapp:view',
    CREATE = 'whatsapp:create',
    CONNECT = 'whatsapp:connect',
    DELETE = 'whatsapp:delete',
    LOGOUT = 'whatsapp:logout',
}

export enum RecordPermission {
    VIEW = 'record:view',
    CREATE = 'record:create',
    UPDATE = 'record:update',
    DELETE = 'record:delete',
}

export enum ImportedDocumentPermission {
    VIEW = 'imported-document:view',
    CREATE = 'imported-document:create',
    UPDATE = 'imported-document:update',
}

export enum PersonPermission {
    VIEW = 'person:view',
    CREATE = 'person:create',
    UPDATE = 'person:update',
    DELETE = 'person:delete',
}

export enum UploadPermission {
    PREPARE = 'upload:prepare',
    UPLOAD = 'upload:upload',
}

export enum ClinicalProfilePermission {
    VIEW = 'clinical-profile:view',
    UPDATE = 'clinical-profile:update',
}

export enum PatientAlertPermission {
    VIEW = 'patient-alert:view',
    CREATE = 'patient-alert:create',
    UPDATE = 'patient-alert:update',
    DELETE = 'patient-alert:delete',
}

export enum FormTemplatePermission {
    VIEW = 'form-template:view',
    CREATE = 'form-template:create',
    UPDATE = 'form-template:update',
    DELETE = 'form-template:delete',
    PUBLISH = 'form-template:publish',
}

export enum PatientFormPermission {
    VIEW = 'patient-form:view',
    CREATE = 'patient-form:create',
    UPDATE = 'patient-form:update',
    DELETE = 'patient-form:delete',
}

export enum ClinicPermission {
    UPDATE = 'clinic:update',
}

export enum ClinicMemberPermission {
    CREATE = 'clinic-member:create',
}

export enum ClinicPatientAccessPermission {
    MANAGE = 'clinic-patient-access:manage',
}

export enum DocumentPermissionPermission {
    MANAGE = 'document-permission:manage',
}

export enum InsurancePlanPermission {
    VIEW = 'insurance-plan:view',
    CREATE = 'insurance-plan:create',
}

export enum ClinicalChatPermission {
    VIEW = 'clinical-chat:view',
    CREATE = 'clinical-chat:create',
    UPDATE = 'clinical-chat:update',
    DELETE = 'clinical-chat:delete',
    /** Permissão para re-indexar contexto clínico / disparar rebuild de snapshot */
    REINDEX = 'clinical-chat:reindex',
}

export enum ClinicalDocumentPermission {
    VIEW = 'clinical-document:view',
    CREATE = 'clinical-document:create',
    GENERATE = 'clinical-document:generate',
    CANCEL = 'clinical-document:cancel',
    MANAGE_TEMPLATES = 'clinical-document:manage-templates',
}

export enum SubscriptionPermission {
    VIEW_CLINIC = 'subscription:view-clinic',
    MANAGE = 'subscription:manage',
}

export enum BillingPermission {
    VIEW_MEMBER = 'billing:view-member',
    VIEW_CLINIC = 'billing:view-clinic',
}

export enum PaymentPermission {
    MANAGE = 'payment:manage',
    VIEW = 'payment:view',
}

export enum AppointmentPaymentPermission {
    REGISTER = 'appointment-payment:register',
    UPDATE = 'appointment-payment:update',
    VIEW = 'appointment-payment:view',
}

export enum PatientInsuranceEnrollmentPermission {
    VIEW = 'patient-insurance-enrollment:view',
    CREATE = 'patient-insurance-enrollment:create',
    UPDATE = 'patient-insurance-enrollment:update',
}

export enum InsuranceClaimPermission {
    VIEW = 'insurance-claim:view',
    UPDATE = 'insurance-claim:update',
}

export enum PackagePlanPermission {
    VIEW = 'package-plan:view',
    CREATE = 'package-plan:create',
    UPDATE = 'package-plan:update',
}

export enum PatientPackagePermission {
    VIEW = 'patient-package:view',
    SELL = 'patient-package:sell',
}

export enum PatientSubscriptionPlanPermission {
    VIEW = 'patient-subscription-plan:view',
    CREATE = 'patient-subscription-plan:create',
    UPDATE = 'patient-subscription-plan:update',
}

export enum PatientSubscriptionPermission {
    VIEW = 'patient-subscription:view',
    SUBSCRIBE = 'patient-subscription:subscribe',
    CANCEL = 'patient-subscription:cancel',
}

export enum FinancialReportPermission {
    VIEW = 'financial-report:view',
}

export enum WorkingHoursPermission {
    MANAGE = 'working-hours:manage',
}

export enum MemberBlockPermission {
    CREATE = 'member-block:create',
    LIST = 'member-block:list',
    DELETE = 'member-block:delete',
}

export enum ProfessionalAgendaAccessPermission {
    GRANT = 'professional-agenda-access:grant',
    REVOKE = 'professional-agenda-access:revoke',
    LIST = 'professional-agenda-access:list',
}

export enum RoomPermission {
    VIEW = 'room:view',
    CREATE = 'room:create',
    UPDATE = 'room:update',
    DELETE = 'room:delete',
}

export enum AgentPermission {
    ASK = 'agent:ask',
    VIEW_METRICS = 'agent:view-metrics',
}

export enum AgentProposalPermission {
    VIEW = 'agent-proposal:view',
    CONFIRM = 'agent-proposal:confirm',
    REJECT = 'agent-proposal:reject',
}

export enum KnowledgeBasePermission {
    SEARCH = 'knowledge-base:search',
    INGEST = 'knowledge-base:ingest',
}

export enum AiFormPermission {
    VIEW_CONTEXT = 'ai-form:view-context',
}

export enum DraftEvolutionPermission {
    VIEW = 'draft-evolution:view',
    UPDATE = 'draft-evolution:update',
    APPROVE = 'draft-evolution:approve',
}

export enum ClinicModulePermission {
    VIEW = 'clinic-module:view',
    ASSIGN = 'clinic-module:assign',
}

/** Contratação de licença e pacotes. Só SUPER_ADMIN: nunca entra no teto de um papel de clínica. */
export enum ClinicLicensePermission {
    MANAGE = 'clinic-license:manage',
}

export enum AuditLogPermission {
    VIEW = 'audit-log:view',
}

const PERMISSIONS = [
    ...Object.values(AuditLogPermission),
    ...Object.values(UserPermission),
    ...Object.values(ProfessionalPermission),
    ...Object.values(PatientPermission),
    ...Object.values(AppointmentPermission),
    ...Object.values(RecordPermission),
    ...Object.values(ImportedDocumentPermission),
    ...Object.values(PersonPermission),
    ...Object.values(UploadPermission),
    ...Object.values(ClinicalProfilePermission),
    ...Object.values(PatientAlertPermission),
    ...Object.values(FormTemplatePermission),
    ...Object.values(PatientFormPermission),
    ...Object.values(ClinicPermission),
    ...Object.values(ClinicMemberPermission),
    ...Object.values(ClinicPatientAccessPermission),
    ...Object.values(DocumentPermissionPermission),
    ...Object.values(InsurancePlanPermission),
    ...Object.values(ClinicalChatPermission),
    ...Object.values(ClinicalDocumentPermission),
    ...Object.values(AppointmentReminderPermission),
    ...Object.values(ClinicReminderConfigPermission),
    ...Object.values(WhatsAppPermission),
    ...Object.values(SubscriptionPermission),
    ...Object.values(BillingPermission),
    ...Object.values(PaymentPermission),
    ...Object.values(AppointmentPaymentPermission),
    ...Object.values(PatientInsuranceEnrollmentPermission),
    ...Object.values(InsuranceClaimPermission),
    ...Object.values(PackagePlanPermission),
    ...Object.values(PatientPackagePermission),
    ...Object.values(PatientSubscriptionPlanPermission),
    ...Object.values(PatientSubscriptionPermission),
    ...Object.values(FinancialReportPermission),
    ...Object.values(WorkingHoursPermission),
    ...Object.values(MemberBlockPermission),
    ...Object.values(ProfessionalAgendaAccessPermission),
    ...Object.values(RoomPermission),
    ...Object.values(AgentPermission),
    ...Object.values(AgentProposalPermission),
    ...Object.values(KnowledgeBasePermission),
    ...Object.values(AiFormPermission),
    ...Object.values(DraftEvolutionPermission),
    ...Object.values(ClinicModulePermission),
    ...Object.values(ClinicLicensePermission),
];

const GLOBAL_ONLY_PERMISSIONS: readonly string[] = Object.values(ClinicLicensePermission);

export type Permission = (typeof PERMISSIONS)[number];

// eslint-disable-next-line @typescript-eslint/no-namespace -- Allow for declaration merging
export namespace Permission {
    export function of(value: string): Permission {
        if (!PERMISSIONS.includes(value as Permission)) {
            throw new Error(`Unknown permission: ${value}`);
        }

        return value as Permission;
    }

    export function all(): Set<Permission> {
        return new Set(PERMISSIONS);
    }

    /** Todas, menos as reservadas a SUPER_ADMIN. */
    export function clinicScoped(): Set<Permission> {
        return new Set(PERMISSIONS.filter((permission) => !GLOBAL_ONLY_PERMISSIONS.includes(permission)));
    }
}
