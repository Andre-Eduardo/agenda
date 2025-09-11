import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Stock} from '../entities';

export class StockCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'STOCK_CREATED';
    readonly stock: Stock;

    constructor(props: DomainEventProps<StockCreatedEvent>) {
        super(StockCreatedEvent.type, props);
        this.stock = props.stock;
    }
}
