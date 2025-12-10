import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Professional} from '../entities';

export class ProfessionalChangedEvent extends DomainEvent {
    static readonly type = 'PROFESSIONAL_CHANGED';
    readonly oldState: Professional;
    readonly newState: Professional;

    constructor(props: DomainEventProps<ProfessionalChangedEvent>) {
        super(ProfessionalChangedEvent.type, props.timestamp);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
