import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Product} from '../entities';

export class ProductCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'PRODUCT_CREATED';
    readonly product: Product;

    constructor(props: DomainEventProps<ProductCreatedEvent>) {
        super(ProductCreatedEvent.type, props);
        this.product = props.product;
    }
}
