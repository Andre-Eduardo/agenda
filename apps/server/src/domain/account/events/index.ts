import {AccountChangedEvent} from './account-changed.event';
import {AccountCreatedEvent} from './account-created.event';
import {AccountDeletedEvent} from './account-deleted.event';

export * from './account-changed.event';
export * from './account-created.event';
export * from './account-deleted.event';

export const accountEvents = [AccountCreatedEvent, AccountChangedEvent, AccountDeletedEvent];
