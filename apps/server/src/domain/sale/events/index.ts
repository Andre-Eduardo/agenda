import {DirectSaleChangedEvent} from './direct-sale-changed.event';
import {DirectSaleCreatedEvent} from './direct-sale-created.event';

export * from './direct-sale-changed.event';
export * from './direct-sale-created.event';

export const directSaleEvents = [DirectSaleCreatedEvent, DirectSaleChangedEvent];
