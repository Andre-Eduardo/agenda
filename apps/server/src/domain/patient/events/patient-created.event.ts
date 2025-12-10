import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Patient} from '../entities';

export class PatientCreatedEvent extends DomainEvent {
    static readonly type = 'PATIENT_CREATED';
    readonly patient: Patient;

    constructor(props: DomainEventProps<PatientCreatedEvent>) {
        super(PatientCreatedEvent.type, props.timestamp);
        this.patient = props.patient;
    }
}
