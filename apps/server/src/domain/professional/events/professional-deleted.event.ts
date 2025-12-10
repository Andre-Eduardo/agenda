import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Professional} from '../entities';

export class ProfessionalDeletedEvent extends DomainEvent {
    static readonly type = 'PROFESSIONAL_DELETED';
    readonly professional: Professional;

    constructor(props: DomainEventProps<ProfessionalDeletedEvent>) {
        super(ProfessionalDeletedEvent.type, props.timestamp);
        this.professional = props.professional;
    }
}
