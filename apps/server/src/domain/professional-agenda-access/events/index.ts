import {ProfessionalAgendaAccessGrantedEvent} from '@domain/professional-agenda-access/events/professional-agenda-access-granted.event';
import {ProfessionalAgendaAccessRevokedEvent} from '@domain/professional-agenda-access/events/professional-agenda-access-revoked.event';

export * from '@domain/professional-agenda-access/events/professional-agenda-access-granted.event';
export * from '@domain/professional-agenda-access/events/professional-agenda-access-revoked.event';

export const professionalAgendaAccessEvents = [
    ProfessionalAgendaAccessGrantedEvent,
    ProfessionalAgendaAccessRevokedEvent,
];
