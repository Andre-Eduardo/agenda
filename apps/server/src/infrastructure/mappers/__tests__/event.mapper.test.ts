import type {Actor} from '../../../domain/@shared/actor';
import {unknownActor} from '../../../domain/@shared/actor';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {ClinicId} from '../../../domain/clinic/entities';
import type {DomainEventProps} from '../../../domain/event';
import {DomainEvent} from '../../../domain/event';
import {fakeUser} from '../../../domain/user/entities/__tests__/fake-user';
import {
    UserChangedEvent,
    UserCreatedEvent,
    UserDeletedEvent,
    UserPasswordChangedEvent,
    UserSignedUpEvent,
} from '../../../domain/user/events';
import type {EventDbModel} from '../event.mapper';
import {EventMapper} from '../event.mapper';

/**
 * Not a real domain event: it carries a bare password value object, outside of any aggregate,
 * to prove that the persisted payload cannot leak it even if a future event does that.
 */
class CredentialLeakEvent extends DomainEvent {
    readonly credential: ReturnType<typeof fakeUser>['password'];

    constructor(props: DomainEventProps<CredentialLeakEvent>) {
        super('USER_CREATED', props.timestamp);
        this.credential = props.credential;
    }
}

/** Every property name found anywhere in a JSON-like value. */
function collectKeys(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.flatMap(collectKeys);
    }

    if (typeof value === 'object' && value !== null) {
        return Object.entries(value).flatMap(([key, nested]) => [key, ...collectKeys(nested)]);
    }

    return [];
}

describe('EventMapper', () => {
    const mapper = new EventMapper();
    const secretKeys = ['password', 'hash', 'salt', 'keySize'];

    const actor: Actor = {
        userId: fakeUser().id,
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };

    describe('toPersistence', () => {
        it('should map the actor and the event metadata to columns and keep them out of the payload', () => {
            const timestamp = new Date(1000);
            const event = new UserPasswordChangedEvent({userId: actor.userId, timestamp});

            expect(mapper.toPersistence({actor, payload: event})).toEqual({
                type: 'USER_PASSWORD_CHANGED',
                payload: {userId: actor.userId.toString()},
                userIp: '127.0.0.1',
                clinicId: actor.clinicId.toString(),
                memberId: actor.clinicMemberId.toString(),
                timestamp,
            });
        });

        it('should store null clinic and member when the actor is not authenticated', () => {
            const event = new UserPasswordChangedEvent({userId: actor.userId, timestamp: new Date(1000)});

            expect(mapper.toPersistence({actor: unknownActor, payload: event})).toMatchObject({
                userIp: '0.0.0.0',
                clinicId: null,
                memberId: null,
            });
        });

        it('should persist identifiers and dates as the strings the payload type declares', () => {
            const user = fakeUser();
            const event = new UserCreatedEvent({user, timestamp: new Date(1000)});

            const {payload} = mapper.toPersistence({actor, payload: event});

            expect(payload).toEqual(JSON.parse(JSON.stringify(payload)));
            expect(payload).toEqual({user: user.toJSON()});
        });

        describe.each([
            ['USER_CREATED', (user: ReturnType<typeof fakeUser>) => new UserCreatedEvent({user})],
            ['USER_SIGNED_UP', (user: ReturnType<typeof fakeUser>) => new UserSignedUpEvent({user})],
            ['USER_DELETED', (user: ReturnType<typeof fakeUser>) => new UserDeletedEvent({user})],
            [
                'USER_CHANGED',
                (user: ReturnType<typeof fakeUser>) => new UserChangedEvent({oldState: user, newState: fakeUser()}),
            ],
        ])('for a %s event', (_, createEvent) => {
            it('should never persist the password hash, salt or key size', () => {
                const user = fakeUser();
                const [, salt, hash] = user.password.encode().split(':');

                const {payload} = mapper.toPersistence({actor, payload: createEvent(user)});
                const serialized = JSON.stringify(payload);

                expect(collectKeys(payload)).not.toIncludeAnyMembers(secretKeys);
                expect(serialized).not.toInclude(salt);
                expect(serialized).not.toInclude(hash);
            });

            it('should keep the identification of the user that the audit trail needs', () => {
                const user = fakeUser();

                const {payload} = mapper.toPersistence({actor, payload: createEvent(user)});

                expect(JSON.stringify(payload)).toIncludeMultiple([
                    user.id.toString(),
                    user.username.toString(),
                    user.name,
                ]);
            });
        });

        it('should redact a password value object that is carried outside of an aggregate', () => {
            const {password} = fakeUser();
            const [, salt, hash] = password.encode().split(':');

            const {payload} = mapper.toPersistence({
                actor,
                payload: new CredentialLeakEvent({credential: password, timestamp: new Date(1000)}),
            });
            const serialized = JSON.stringify(payload);

            expect(collectKeys(payload)).not.toIncludeAnyMembers(['hash', 'salt', 'keySize']);
            expect(serialized).not.toInclude(salt);
            expect(serialized).not.toInclude(hash);
            expect(payload).toEqual({credential: '[REDACTED]'});
        });
    });

    describe('toDomain', () => {
        it('should map a database row to the domain model', () => {
            const row: EventDbModel = {
                id: 7,
                type: 'USER_PASSWORD_CHANGED',
                payload: {userId: actor.userId.toString()},
                userIp: '127.0.0.1',
                clinicId: actor.clinicId.toString(),
                memberId: actor.clinicMemberId.toString(),
                timestamp: new Date(1000),
            };

            expect(mapper.toDomain(row)).toEqual({
                id: 7,
                type: 'USER_PASSWORD_CHANGED',
                payload: {userId: actor.userId.toString()},
                timestamp: new Date(1000),
            });
        });
    });
});
