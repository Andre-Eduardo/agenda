export type AuditLogEntry = {
    id: string;
    clinicId: string;
    actorUserId: string;
    actorMemberId: string;
    resource: string;
    resourceId: string | null;
    action: string;
    result: 'SUCCESS' | 'DENIED' | 'ERROR';
    statusCode: number;
    ip: string;
    occurredAt: Date;
};

export type NewAuditLogEntry = Omit<AuditLogEntry, 'id' | 'occurredAt'>;

export interface AuditLogRepository {
    append(entry: NewAuditLogEntry): Promise<void>;
    search(clinicId: string, page: number, pageSize: number): Promise<{data: AuditLogEntry[]; totalCount: number}>;
}

export const AuditLogRepository = Symbol('AuditLogRepository');
