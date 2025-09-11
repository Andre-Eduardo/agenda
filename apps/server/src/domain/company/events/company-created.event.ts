import type {DomainEventProps} from '../../event';
import type {Company} from '../entities';
import {CompanyDomainEvent} from './company.domain.event';

export class CompanyCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'COMPANY_CREATED';
    readonly company: Company;

    constructor(props: DomainEventProps<CompanyCreatedEvent>) {
        super(CompanyCreatedEvent.type, props);
        this.company = props.company;
    }
}
