import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {ClinicPatientAccess} from '../entities';

export class ClinicPatientAccessChangedEvent extends DomainEvent {
    static readonly type = 'CLINIC_PATIENT_ACCESS_CHANGED';
    readonly oldState: ClinicPatientAccess;
    readonly newState: ClinicPatientAccess;

    constructor(props: DomainEventProps<ClinicPatientAccessChangedEvent>) {
        super(ClinicPatientAccessChangedEvent.type, props.timestamp);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
