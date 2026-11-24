import type {ClinicLicense} from '@domain/clinic-license/entities';
import type {ModuleType} from '@domain/clinic-license/models';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {DomainEventProps} from '@domain/event';
import {DomainEvent} from '@domain/event';

export class ClinicModuleUnassignedEvent extends DomainEvent {
    static readonly type = 'CLINIC_MODULE_UNASSIGNED';
    readonly license: ClinicLicense;
    readonly moduleType: ModuleType;
    readonly clinicMemberId: ClinicMemberId;

    constructor(props: DomainEventProps<ClinicModuleUnassignedEvent>) {
        super(ClinicModuleUnassignedEvent.type, props.timestamp);
        this.license = props.license;
        this.moduleType = props.moduleType;
        this.clinicMemberId = props.clinicMemberId;
    }
}
