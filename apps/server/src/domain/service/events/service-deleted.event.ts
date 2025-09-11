import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Service} from '../entities';

export class ServiceDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'SERVICE_DELETED';
    readonly service: Service;

    constructor(props: DomainEventProps<ServiceDeletedEvent>) {
        super(ServiceDeletedEvent.type, props);
        this.service = props.service;
    }
}
