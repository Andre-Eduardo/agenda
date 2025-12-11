import {UserChangedEvent} from './user-changed.event';
import {UserCreatedEvent} from './user-created.event';
import {UserDeletedEvent} from './user-deleted.event';
import {UserPasswordChangedEvent} from './user-password-changed.event';
import {UserProfessionalAddedEvent} from './user-professional-added.event';
import {UserProfessionalRemovedEvent} from './user-professional-removed.event';
import {UserSignedInEvent} from './user-signed-in.event';
import {UserSignedOutEvent} from './user-signed-out.event';
import {UserSignedUpEvent} from './user-signed-up.event';

export * from './user-changed.event';
export * from './user-created.event';
export * from './user-deleted.event';
export * from './user-password-changed.event';
export * from './user-professional-added.event';
export * from './user-professional-removed.event';
export * from './user-signed-in.event';
export * from './user-signed-out.event';
export * from './user-signed-up.event';

export const userEvents = [
    UserCreatedEvent,
    UserChangedEvent,
    UserDeletedEvent,
    UserSignedUpEvent,
    UserSignedInEvent,
    UserSignedOutEvent,
    UserPasswordChangedEvent,
    UserProfessionalAddedEvent,
    UserProfessionalRemovedEvent,
];
