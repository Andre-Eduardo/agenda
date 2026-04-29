import { ClinicMemberCreatedEvent } from "@domain/clinic-member/events/clinic-member-created.event";
import { ClinicMemberChangedEvent } from "@domain/clinic-member/events/clinic-member-changed.event";
import { ClinicMemberDeletedEvent } from "@domain/clinic-member/events/clinic-member-deleted.event";

export * from "@domain/clinic-member/events/clinic-member-changed.event";
export * from "@domain/clinic-member/events/clinic-member-created.event";
export * from "@domain/clinic-member/events/clinic-member-deleted.event";

export const clinicMemberEvents = [
  ClinicMemberCreatedEvent,
  ClinicMemberChangedEvent,
  ClinicMemberDeletedEvent,
];
