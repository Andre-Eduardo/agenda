import type {ClinicLicense} from '@domain/clinic-license/entities';
import type {ModuleType} from '@domain/clinic-license/models';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {DomainEventProps} from '@domain/event';
import {DomainEvent} from '@domain/event';

export class ClinicModuleAssignedEvent extends DomainEvent {
    static readonly type = 'CLINIC_MODULE_ASSIGNED';
    readonly license: ClinicLicense;
    readonly moduleType: ModuleType;
    readonly clinicMemberId: ClinicMemberId;
    /** A vaga entrou acima do contratado, com aceite da cobrança extra. */
    readonly extraCharge: boolean;

    constructor(props: DomainEventProps<ClinicModuleAssignedEvent>) {
        super(ClinicModuleAssignedEvent.type, props.timestamp);
        this.license = props.license;
        this.moduleType = props.moduleType;
        this.clinicMemberId = props.clinicMemberId;
        this.extraCharge = props.extraCharge;
    }
}
