import type {DomainEventProps} from '@domain/event';
import {DomainEvent} from '@domain/event';
import type {ProfessionalAgendaAccess} from '@domain/professional-agenda-access/entities';

export class ProfessionalAgendaAccessRevokedEvent extends DomainEvent {
    static readonly type = 'PROFESSIONAL_AGENDA_ACCESS_REVOKED';
    readonly access: ProfessionalAgendaAccess;

    constructor(props: DomainEventProps<ProfessionalAgendaAccessRevokedEvent>) {
        super(ProfessionalAgendaAccessRevokedEvent.type, props.timestamp);
        this.access = props.access;
    }
}
