import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Patient} from '../entities';

export class PatientDeletedEvent extends DomainEvent {
    static readonly type = 'PATIENT_DELETED';
    readonly patient: Patient;

    constructor(props: DomainEventProps<PatientDeletedEvent>) {
        super(PatientDeletedEvent.type, props.timestamp);
        this.patient = props.patient;
    }
}
