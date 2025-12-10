import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Professional} from '../entities';

export class ProfessionalCreatedEvent extends DomainEvent {
    static readonly type = 'PROFESSIONAL_CREATED';
    readonly professional: Professional;

    constructor(props: DomainEventProps<ProfessionalCreatedEvent>) {
        super(ProfessionalCreatedEvent.type, props.timestamp);
        this.professional = props.professional;
    }
}
