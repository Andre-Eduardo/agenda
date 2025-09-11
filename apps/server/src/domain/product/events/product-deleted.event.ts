import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Product} from '../entities';

export class ProductDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'PRODUCT_DELETED';
    readonly product: Product;

    constructor(props: DomainEventProps<ProductDeletedEvent>) {
        super(ProductDeletedEvent.type, props);
        this.product = props.product;
    }
}
