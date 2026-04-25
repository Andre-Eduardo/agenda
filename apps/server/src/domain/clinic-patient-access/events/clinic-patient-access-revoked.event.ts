import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {ClinicPatientAccess} from '../entities';

export class ClinicPatientAccessRevokedEvent extends DomainEvent {
    static readonly type = 'CLINIC_PATIENT_ACCESS_REVOKED';
    readonly access: ClinicPatientAccess;

    constructor(props: DomainEventProps<ClinicPatientAccessRevokedEvent>) {
        super(ClinicPatientAccessRevokedEvent.type, props.timestamp);
        this.access = props.access;
    }
}
