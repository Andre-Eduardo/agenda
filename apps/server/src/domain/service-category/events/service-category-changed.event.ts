import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {ServiceCategory} from '../entities';

export class ServiceCategoryChangedEvent extends CompanyDomainEvent {
    static readonly type = 'SERVICE_CATEGORY_CHANGED';
    readonly oldState: ServiceCategory;
    readonly newState: ServiceCategory;

    constructor(props: DomainEventProps<ServiceCategoryChangedEvent>) {
        super(ServiceCategoryChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
