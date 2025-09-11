import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {ProductCategory} from '../entities';

export class ProductCategoryDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'PRODUCT_CATEGORY_DELETED';
    readonly productCategory: ProductCategory;

    constructor(props: DomainEventProps<ProductCategoryDeletedEvent>) {
        super(ProductCategoryDeletedEvent.type, props);
        this.productCategory = props.productCategory;
    }
}
