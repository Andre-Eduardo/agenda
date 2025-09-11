import {StockChangedEvent} from './stock-changed.event';
import {StockCreatedEvent} from './stock-created.event';
import {StockDeletedEvent} from './stock-deleted.event';

export * from './stock-changed.event';
export * from './stock-created.event';
export * from './stock-deleted.event';

export const stockEvents = [StockCreatedEvent, StockChangedEvent, StockDeletedEvent];
