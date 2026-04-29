import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";

export type AddonPurchasedData = {
  memberId: string;
  clinicId: string;
  addonCode: string;
  quantity: number;
  periodYear: number;
  periodMonth: number;
  pricePaidBrl: number;
};

export class AddonPurchasedEvent extends DomainEvent {
  static readonly type = "ADDON_PURCHASED";
  readonly data: AddonPurchasedData;

  constructor(props: DomainEventProps<AddonPurchasedEvent>) {
    super(AddonPurchasedEvent.type, props.timestamp);
    this.data = props.data;
  }
}
