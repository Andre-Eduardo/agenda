import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { ClinicalProfile } from "@domain/clinical-profile/entities";

export class ClinicalProfileChangedEvent extends DomainEvent {
  static readonly type = "CLINICAL_PROFILE_CHANGED";
  readonly oldState: ClinicalProfile;
  readonly newState: ClinicalProfile;

  constructor(props: DomainEventProps<ClinicalProfileChangedEvent>) {
    super(ClinicalProfileChangedEvent.type, props.timestamp);
    this.oldState = props.oldState;
    this.newState = props.newState;
  }
}
