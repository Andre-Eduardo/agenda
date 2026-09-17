import type {DomainEventProps} from '@domain/event';
import {DomainEvent} from '@domain/event';
import type {ProfessionalAgendaAccess} from '@domain/professional-agenda-access/entities';

export class ProfessionalAgendaAccessGrantedEvent extends DomainEvent {
    static readonly type = 'PROFESSIONAL_AGENDA_ACCESS_GRANTED';
    readonly access: ProfessionalAgendaAccess;

    constructor(props: DomainEventProps<ProfessionalAgendaAccessGrantedEvent>) {
        super(ProfessionalAgendaAccessGrantedEvent.type, props.timestamp);
        this.access = props.access;
    }
}
