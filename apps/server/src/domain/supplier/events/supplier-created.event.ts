import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Supplier} from '../entities';

export class SupplierCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'SUPPLIER_CREATED';
    readonly supplier: Supplier;

    constructor(props: DomainEventProps<SupplierCreatedEvent>) {
        super(SupplierCreatedEvent.type, props);
        this.supplier = props.supplier;
    }
}
