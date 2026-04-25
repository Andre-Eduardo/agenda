import {AddonPurchasedEvent} from './addon-purchased.event';

export * from './addon-purchased.event';

export const subscriptionEvents = [AddonPurchasedEvent] as const;
