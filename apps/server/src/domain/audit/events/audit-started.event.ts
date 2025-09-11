import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Audit} from '../entities';

export class AuditStartedEvent extends CompanyDomainEvent {
    static readonly type = 'AUDIT_STARTED';
    readonly audit: Audit;

    constructor(props: DomainEventProps<AuditStartedEvent>) {
        super(AuditStartedEvent.type, props);
        this.audit = props.audit;
    }
}
