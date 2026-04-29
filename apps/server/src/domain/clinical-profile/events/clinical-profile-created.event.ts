import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { ClinicalProfile } from "@domain/clinical-profile/entities";

export class ClinicalProfileCreatedEvent extends DomainEvent {
  static readonly type = "CLINICAL_PROFILE_CREATED";
  readonly profile: ClinicalProfile;

  constructor(props: DomainEventProps<ClinicalProfileCreatedEvent>) {
    super(ClinicalProfileCreatedEvent.type, props.timestamp);
    this.profile = props.profile;
  }
}
