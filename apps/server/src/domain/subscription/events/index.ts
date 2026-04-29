import { AddonPurchasedEvent } from "@domain/subscription/events/addon-purchased.event";

export * from "@domain/subscription/events/addon-purchased.event";

export const subscriptionEvents = [AddonPurchasedEvent] as const;
