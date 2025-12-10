import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {EventType} from '../../event/event.type';
import type {ProfessionalId} from '../entities';

export abstract class ProfessionalDomainEvent extends DomainEvent {
    readonly professionalId: ProfessionalId;

    protected constructor(type: EventType, props: DomainEventProps<ProfessionalDomainEvent>) {
        super(type, props.timestamp);
        this.professionalId = props.professionalId;
    }
}
