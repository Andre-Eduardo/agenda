import type {DomainEventProps} from '../../event';
import type {Company} from '../entities';
import {CompanyDomainEvent} from './company.domain.event';

export class CompanyDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'COMPANY_DELETED';
    readonly company: Company;

    constructor(props: DomainEventProps<CompanyDeletedEvent>) {
        super(CompanyDeletedEvent.type, props);
        this.company = props.company;
    }
}
