import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Clinic} from '../entities';

export class ClinicCreatedEvent extends DomainEvent {
    static readonly type = 'CLINIC_CREATED';
    readonly clinic: Clinic;

    constructor(props: DomainEventProps<ClinicCreatedEvent>) {
        super(ClinicCreatedEvent.type, props.timestamp);
        this.clinic = props.clinic;
    }
}
