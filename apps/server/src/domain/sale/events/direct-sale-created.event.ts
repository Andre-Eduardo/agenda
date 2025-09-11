import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {DirectSale} from '../entities';

export class DirectSaleCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'DIRECT_SALE_CREATED';
    readonly directSale: DirectSale;

    constructor(props: DomainEventProps<DirectSaleCreatedEvent>) {
        super(DirectSaleCreatedEvent.type, props);
        this.directSale = props.directSale;
    }
}
