import type {Clinic, ClinicAccountType} from '@domain/clinic/entities';
import type {DomainEventProps} from '@domain/event';
import {DomainEvent} from '@domain/event';

/** Conta passou de autônomo para clínica ou o contrário. Fica na trilha de auditoria (LGPD). */
export class ClinicAccountTypeChangedEvent extends DomainEvent {
    static readonly type = 'CLINIC_ACCOUNT_TYPE_CHANGED';
    readonly clinic: Clinic;
    readonly from: ClinicAccountType;
    readonly to: ClinicAccountType;

    constructor(props: DomainEventProps<ClinicAccountTypeChangedEvent>) {
        super(ClinicAccountTypeChangedEvent.type, props.timestamp);
        this.clinic = props.clinic;
        this.from = props.from;
        this.to = props.to;
    }
}
