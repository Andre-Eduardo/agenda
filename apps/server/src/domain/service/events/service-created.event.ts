import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Service} from '../entities';

export class ServiceCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'SERVICE_CREATED';
    readonly service: Service;

    constructor(props: DomainEventProps<ServiceCreatedEvent>) {
        super(ServiceCreatedEvent.type, props);
        this.service = props.service;
    }
}
