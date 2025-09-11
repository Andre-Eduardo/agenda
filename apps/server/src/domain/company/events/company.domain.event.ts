import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {EventType} from '../../event/event.type';
import type {CompanyId} from '../entities';

export abstract class CompanyDomainEvent extends DomainEvent {
    readonly companyId: CompanyId;

    protected constructor(type: EventType, props: DomainEventProps<CompanyDomainEvent>) {
        super(type, props.timestamp);
        this.companyId = props.companyId;
    }
}
