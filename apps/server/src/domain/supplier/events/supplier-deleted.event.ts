import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Supplier} from '../entities';

export class SupplierDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'SUPPLIER_DELETED';
    readonly supplier: Supplier;

    constructor(props: DomainEventProps<SupplierDeletedEvent>) {
        super(SupplierDeletedEvent.type, props);
        this.supplier = props.supplier;
    }
}
