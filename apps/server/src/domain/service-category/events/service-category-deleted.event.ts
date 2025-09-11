import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {ServiceCategory} from '../entities';

export class ServiceCategoryDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'SERVICE_CATEGORY_DELETED';
    readonly serviceCategory: ServiceCategory;

    constructor(props: DomainEventProps<ServiceCategoryDeletedEvent>) {
        super(ServiceCategoryDeletedEvent.type, props);
        this.serviceCategory = props.serviceCategory;
    }
}
