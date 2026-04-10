import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {PatientAlert} from '../entities';

export class PatientAlertChangedEvent extends DomainEvent {
    static readonly type = 'PATIENT_ALERT_CHANGED';
    readonly oldState: PatientAlert;
    readonly newState: PatientAlert;

    constructor(props: DomainEventProps<PatientAlertChangedEvent>) {
        super(PatientAlertChangedEvent.type, props.timestamp);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
