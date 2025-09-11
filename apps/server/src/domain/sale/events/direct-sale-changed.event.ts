import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {DirectSale} from '../entities';

export class DirectSaleChangedEvent extends CompanyDomainEvent {
    static readonly type = 'DIRECT_SALE_CHANGED';
    readonly oldState: DirectSale;
    readonly newState: DirectSale;

    constructor(props: DomainEventProps<DirectSaleChangedEvent>) {
        super(DirectSaleChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
