import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {ProductCategory} from '../entities';

export class ProductCategoryCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'PRODUCT_CATEGORY_CREATED';
    readonly productCategory: ProductCategory;

    constructor(props: DomainEventProps<ProductCategoryCreatedEvent>) {
        super(ProductCategoryCreatedEvent.type, props);
        this.productCategory = props.productCategory;
    }
}
