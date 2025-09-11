import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {ServiceCategory} from '../entities';

export class ServiceCategoryCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'SERVICE_CATEGORY_CREATED';
    readonly serviceCategory: ServiceCategory;

    constructor(props: DomainEventProps<ServiceCategoryCreatedEvent>) {
        super(ServiceCategoryCreatedEvent.type, props);
        this.serviceCategory = props.serviceCategory;
    }
}
