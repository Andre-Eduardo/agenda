import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Product} from '../entities';

export class ProductChangedEvent extends CompanyDomainEvent {
    static readonly type = 'PRODUCT_CHANGED';
    readonly oldState: Product;
    readonly newState: Product;

    constructor(props: DomainEventProps<ProductChangedEvent>) {
        super(ProductChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
