import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Clinic} from '../entities';

export class ClinicDeletedEvent extends DomainEvent {
    static readonly type = 'CLINIC_DELETED';
    readonly clinic: Clinic;

    constructor(props: DomainEventProps<ClinicDeletedEvent>) {
        super(ClinicDeletedEvent.type, props.timestamp);
        this.clinic = props.clinic;
    }
}
