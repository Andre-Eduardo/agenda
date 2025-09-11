import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {ProductCategory} from '../entities';

export class ProductCategoryChangedEvent extends CompanyDomainEvent {
    static readonly type = 'PRODUCT_CATEGORY_CHANGED';
    readonly oldState: ProductCategory;
    readonly newState: ProductCategory;

    constructor(props: DomainEventProps<ProductCategoryChangedEvent>) {
        super(ProductCategoryChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
