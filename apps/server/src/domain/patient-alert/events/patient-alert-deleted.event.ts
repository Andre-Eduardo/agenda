import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {PatientAlert} from '../entities';

export class PatientAlertDeletedEvent extends DomainEvent {
    static readonly type = 'PATIENT_ALERT_DELETED';
    readonly alert: PatientAlert;

    constructor(props: DomainEventProps<PatientAlertDeletedEvent>) {
        super(PatientAlertDeletedEvent.type, props.timestamp);
        this.alert = props.alert;
    }
}
