import {AuditFinishedEvent} from './audit-finished.event';
import {AuditStartedEvent} from './audit-started.event';

export * from './audit-finished.event';
export * from './audit-started.event';

export const auditEvents = [AuditStartedEvent, AuditFinishedEvent];
