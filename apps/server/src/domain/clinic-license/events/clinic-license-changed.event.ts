import type {ClinicLicense} from '@domain/clinic-license/entities';
import type {DomainEventProps} from '@domain/event';
import {DomainEvent} from '@domain/event';

export class ClinicLicenseChangedEvent extends DomainEvent {
    static readonly type = 'CLINIC_LICENSE_CHANGED';
    readonly oldState: ClinicLicense;
    readonly newState: ClinicLicense;

    constructor(props: DomainEventProps<ClinicLicenseChangedEvent>) {
        super(ClinicLicenseChangedEvent.type, props.timestamp);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
