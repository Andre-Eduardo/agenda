import type {ClinicLicense} from '@domain/clinic-license/entities';
import type {DomainEventProps} from '@domain/event';
import {DomainEvent} from '@domain/event';

/** Um profissional entrou acima do incluído no plano, com aceite da cobrança extra. */
export class ProfessionalExtraSeatAddedEvent extends DomainEvent {
    static readonly type = 'PROFESSIONAL_EXTRA_SEAT_ADDED';
    readonly license: ClinicLicense;

    constructor(props: DomainEventProps<ProfessionalExtraSeatAddedEvent>) {
        super(ProfessionalExtraSeatAddedEvent.type, props.timestamp);
        this.license = props.license;
    }
}
