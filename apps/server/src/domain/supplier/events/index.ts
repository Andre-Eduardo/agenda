import {SupplierChangedEvent} from './supplier-changed.event';
import {SupplierCreatedEvent} from './supplier-created.event';
import {SupplierDeletedEvent} from './supplier-deleted.event';

export * from './supplier-changed.event';
export * from './supplier-created.event';
export * from './supplier-deleted.event';

export const supplierEvents = [SupplierCreatedEvent, SupplierChangedEvent, SupplierDeletedEvent];
