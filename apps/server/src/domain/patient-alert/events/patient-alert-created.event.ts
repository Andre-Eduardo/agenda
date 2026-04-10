import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {PatientAlert} from '../entities';

export class PatientAlertCreatedEvent extends DomainEvent {
    static readonly type = 'PATIENT_ALERT_CREATED';
    readonly alert: PatientAlert;

    constructor(props: DomainEventProps<PatientAlertCreatedEvent>) {
        super(PatientAlertCreatedEvent.type, props.timestamp);
        this.alert = props.alert;
    }
}
