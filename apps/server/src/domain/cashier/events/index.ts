import {CashierClosedEvent} from './cashier-closed.event';
import {CashierOpenedEvent} from './cashier-opened.event';

export * from './cashier-closed.event';
export * from './cashier-opened.event';

export const cashierEvents = [CashierClosedEvent, CashierOpenedEvent];
