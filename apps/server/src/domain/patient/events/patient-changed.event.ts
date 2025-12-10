import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Patient} from '../entities';

export class PatientChangedEvent extends DomainEvent {
    static readonly type = 'PATIENT_CHANGED';
    readonly oldState: Patient;
    readonly newState: Patient;

    constructor(props: DomainEventProps<PatientChangedEvent>) {
        super(PatientChangedEvent.type, props.timestamp);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
