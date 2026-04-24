import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {PatientFormId} from '../entities';
import type {PatientId} from '../../patient/entities';

export class PatientFormCompletedEvent extends DomainEvent {
    static readonly type = 'PATIENT_FORM_COMPLETED';
    readonly formId: PatientFormId;
    readonly patientId: PatientId;

    constructor(props: DomainEventProps<PatientFormCompletedEvent>) {
        super(PatientFormCompletedEvent.type, props.timestamp);
        this.formId = props.formId;
        this.patientId = props.patientId;
    }
}
