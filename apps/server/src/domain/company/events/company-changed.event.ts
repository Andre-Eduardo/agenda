import type {DomainEventProps} from '../../event';
import type {Company} from '../entities';
import {CompanyDomainEvent} from './company.domain.event';

export class CompanyChangedEvent extends CompanyDomainEvent {
    static readonly type = 'COMPANY_CHANGED';
    readonly oldState: Company;
    readonly newState: Company;

    constructor(props: DomainEventProps<CompanyChangedEvent>) {
        super(CompanyChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
