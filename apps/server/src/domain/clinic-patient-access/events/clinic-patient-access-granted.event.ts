import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {ClinicPatientAccess} from '../entities';

export class ClinicPatientAccessGrantedEvent extends DomainEvent {
    static readonly type = 'CLINIC_PATIENT_ACCESS_GRANTED';
    readonly access: ClinicPatientAccess;

    constructor(props: DomainEventProps<ClinicPatientAccessGrantedEvent>) {
        super(ClinicPatientAccessGrantedEvent.type, props.timestamp);
        this.access = props.access;
    }
}
