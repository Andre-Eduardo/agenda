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
}

export enum ClinicReminderConfigPermission {
    VIEW = 'clinic-reminder-config:view',
    MANAGE = 'clinic-reminder-config:manage',
}

export enum RecordPermission {
    VIEW = 'record:view',
    CREATE = 'record:create',
    UPDATE = 'record:update',
    DELETE = 'record:delete',
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

const PERMISSIONS = [
    ...Object.values(UserPermission),
    ...Object.values(ProfessionalPermission),
    ...Object.values(PatientPermission),
    ...Object.values(AppointmentPermission),
    ...Object.values(RecordPermission),
    ...Object.values(PersonPermission),
    ...Object.values(UploadPermission),
    ...Object.values(ClinicalProfilePermission),
    ...Object.values(PatientAlertPermission),
    ...Object.values(FormTemplatePermission),
    ...Object.values(PatientFormPermission),
    ...Object.values(InsurancePlanPermission),
    ...Object.values(ClinicalChatPermission),
    ...Object.values(AppointmentReminderPermission),
    ...Object.values(ClinicReminderConfigPermission),
];

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
}
