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

const PERMISSIONS = [
    ...Object.values(UserPermission),
    ...Object.values(ProfessionalPermission),
    ...Object.values(PatientPermission),
    ...Object.values(AppointmentPermission),
    ...Object.values(RecordPermission),
    ...Object.values(PersonPermission),
    ...Object.values(UploadPermission),
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
