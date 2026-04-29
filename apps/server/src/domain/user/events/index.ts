import { UserChangedEvent } from "@domain/user/events/user-changed.event";
import { UserClinicMemberAddedEvent } from "@domain/user/events/user-clinic-member-added.event";
import { UserClinicMemberRemovedEvent } from "@domain/user/events/user-clinic-member-removed.event";
import { UserCreatedEvent } from "@domain/user/events/user-created.event";
import { UserDeletedEvent } from "@domain/user/events/user-deleted.event";
import { UserPasswordChangedEvent } from "@domain/user/events/user-password-changed.event";
import { UserSignedInEvent } from "@domain/user/events/user-signed-in.event";
import { UserSignedOutEvent } from "@domain/user/events/user-signed-out.event";
import { UserSignedUpEvent } from "@domain/user/events/user-signed-up.event";

export * from "@domain/user/events/user-changed.event";
export * from "@domain/user/events/user-clinic-member-added.event";
export * from "@domain/user/events/user-clinic-member-removed.event";
export * from "@domain/user/events/user-created.event";
export * from "@domain/user/events/user-deleted.event";
export * from "@domain/user/events/user-password-changed.event";
export * from "@domain/user/events/user-signed-in.event";
export * from "@domain/user/events/user-signed-out.event";
export * from "@domain/user/events/user-signed-up.event";

export const userEvents = [
  UserCreatedEvent,
  UserChangedEvent,
  UserDeletedEvent,
  UserSignedUpEvent,
  UserSignedInEvent,
  UserSignedOutEvent,
  UserPasswordChangedEvent,
  UserClinicMemberAddedEvent,
  UserClinicMemberRemovedEvent,
];
