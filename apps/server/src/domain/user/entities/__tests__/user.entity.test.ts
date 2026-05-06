import {AccessDeniedException, AccessDeniedReason, InvalidInputException} from '../../../@shared/exceptions';
import {Email} from '../../../@shared/value-objects';
import {GlobalRole} from '../../../auth';
import {ProfessionalId} from '../../../professional/entities';
import {
    UserChangedEvent,
    UserProfessionalAddedEvent,
    UserProfessionalRemovedEvent,
    UserCreatedEvent,
    UserDeletedEvent,
    UserPasswordChangedEvent,
    UserSignedInEvent,
    UserSignedOutEvent,
    UserSignedUpEvent,
} from '../../events';
import {ObfuscatedPassword, Username} from '../../value-objects';
import type {SignUpUser, UpdateUser} from '../index';
import {User, UserId} from '../index';
import {fakeUser} from './fake-user';

describe('A user', () => {
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on signing up', () => {
        it('should emit a user-signed-up event', async () => {
            const user = await User.signUp({
                username: Username.create('john_doe'),
                email: Email.create('john_doe@example.com'),
                password: 'Pa$$w0rd',
                name: 'John Doe',
            });

            expect(user.id).toBeInstanceOf(UserId);
            expect(user.username.toString()).toBe('john_doe');
            expect(user.email!.toString()).toBe('john_doe@example.com');
            expect(user.password).toBeInstanceOf(ObfuscatedPassword);
            await expect(user.password.verify('Pa$$w0rd')).resolves.toBe(true);
            expect(user.name).toBe('John Doe');
            expect(user.globalRole).toBe(GlobalRole.OWNER);
            expect(user.professionals).toEqual([]);
            expect(user.createdAt).toStrictEqual(now);
            expect(user.updatedAt).toStrictEqual(now);

            expect(user.events).toEqual([
                {
                    type: UserSignedUpEvent.type,
                    user,
                    timestamp: now,
                },
            ]);
            expect(user.events[0]).toBeInstanceOf(UserSignedUpEvent);
        });

        it.each<[Partial<SignUpUser>, string]>([
            [{name: ''}, 'Name must be at least 1 character long.'],
            [{name: '   '}, 'Name must not contain whitespace.'],
        ])('should throw an error when receiving invalid data', async (payload, expectedError) => {
            const user: SignUpUser = {
                username: Username.create('user1'),
                password: 'Pa$$w0rd',
                email: Email.create('user@example.com'),
                name: 'User One',
            };

            await expect(() => User.signUp({...user, ...payload})).rejects.toThrowWithMessage(
                InvalidInputException,
                expectedError
            );
        });
    });

    describe('on creation', () => {
        it('should emit a user-created event', async () => {
            const professionalId = ProfessionalId.generate();

            const user = await User.create({
                username: Username.create('john_doe'),
                password: 'Pa$$w0rd',
                name: 'John Doe',
                professionals: [professionalId],
            });

            expect(user.id).toBeInstanceOf(UserId);
            expect(user.username.toString()).toBe('john_doe');
            expect(user.email).toBe(null);
            expect(user.password).toBeInstanceOf(ObfuscatedPassword);
            await expect(user.password.verify('Pa$$w0rd')).resolves.toBe(true);
            expect(user.name).toBe('John Doe');
            expect(user.globalRole).toBe(GlobalRole.NONE);
            expect(user.professionals).toEqual([professionalId]);
            expect(user.createdAt).toStrictEqual(now);
            expect(user.updatedAt).toStrictEqual(now);

            expect(user.events[0]).toBeInstanceOf(UserCreatedEvent);
            expect(user.events).toEqual([
                {
                    type: UserCreatedEvent.type,
                    user,
                    timestamp: now,
                },
            ]);
        });

        it.each<[Partial<SignUpUser>, string]>([
            [{name: ''}, 'Name must be at least 1 character long.'],
            [{name: '   '}, 'Name must not contain whitespace.'],
        ])('should throw an error when receiving invalid data', async (payload, expectedError) => {
            const user: SignUpUser = {
                username: Username.create('user1'),
                password: 'Pa$$w0rd',
                email: Email.create('user@example.com'),
                name: 'User One',
            };

            await expect(() => User.signUp({...user, ...payload})).rejects.toThrowWithMessage(
                InvalidInputException,
                expectedError
            );
        });
    });

    describe('on signing in', () => {
        it('should emit a user-signed-in event', async () => {
            const password = 'Pa$$w0rd';

            const user = fakeUser({
                email: Email.create('john_doe@example.com'),
                password: await ObfuscatedPassword.obfuscate(password),
            });

            await user.signIn(password);

            expect(user.events).toEqual([
                {
                    type: UserSignedInEvent.type,
                    userId: user.id,
                    timestamp: now,
                },
            ]);
            expect(user.events[0]).toBeInstanceOf(UserSignedInEvent);
        });

        it('should fail when receiving invalid password', async () => {
            const user = fakeUser();

            // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
            const expectation = expect(user.signIn('wrong-password'));

            await expectation.rejects.toThrowWithMessage(AccessDeniedException, 'Incorrect password.');
            await expectation.rejects.toContainEntry(['reason', AccessDeniedReason.BAD_CREDENTIALS]);
        });
    });

    describe('on signing out', () => {
        it('should emit a user-signed-out event', () => {
            const user = fakeUser();

            user.signOut();

            expect(user.events).toEqual([
                {
                    type: UserSignedOutEvent.type,
                    userId: user.id,
                    timestamp: now,
                },
            ]);
            expect(user.events[0]).toBeInstanceOf(UserSignedOutEvent);
        });
    });

    describe('on change', () => {
        it('should emit a user-changed event', () => {
            const user = fakeUser();

            const oldUser = fakeUser(user);

            const username = Username.create('john_doe_2');
            const email = Email.create('john-do3@gmail.com');
            const name = 'Johny Doey';

            user.change({
                username,
                email,
                name,
            });

            expect(user.username).toBe(username);
            expect(user.email).toBe(email);
            expect(user.name).toBe(name);

            expect(user.events).toEqual([
                {
                    type: UserChangedEvent.type,
                    timestamp: now,
                    oldState: oldUser,
                    newState: user,
                },
            ]);

            expect(user.events[0]).toBeInstanceOf(UserChangedEvent);
        });

        it.each<[UpdateUser, string]>([
            [{name: ''}, 'Name must be at least 1 character long.'],
            [{name: '   '}, 'Name must not contain whitespace.'],
        ])('should throw an error when receiving an invalid value', async (payload, expectedError) => {
            const user = await User.signUp({
                username: Username.create('john_doe'),
                password: 'Pa$$w0rd',
                email: Email.create('john_doe@example.com'),
                name: 'John Doe',
            });

            expect(() => user.change(payload)).toThrowWithMessage(InvalidInputException, expectedError);
        });
    });

    describe('on changing password', () => {
        it('should emit a user-changed event', async () => {
            const user = fakeUser();

            const oldUser = fakeUser(user);

            await user.changePassword('NewPa$$w0rd');

            expect(user.password).not.toBe(oldUser.password);
            await expect(user.password.verify('NewPa$$w0rd')).resolves.toBe(true);

            expect(user.events).toEqual([
                {
                    type: UserPasswordChangedEvent.type,
                    timestamp: now,
                    userId: user.id,
                },
            ]);

            expect(user.events[0]).toBeInstanceOf(UserPasswordChangedEvent);
        });
    });

    describe('when added to a professional', () => {
        it('should emit a user-professional-added event', () => {
            const professionalId1 = ProfessionalId.generate();
            const professionalId2 = ProfessionalId.generate();

            const user = fakeUser({
                professionals: [professionalId1],
            });

            user.addToProfessional(professionalId2);

            expect(user.professionals).toEqual([professionalId1, professionalId2]);

            expect(user.events[0]).toBeInstanceOf(UserProfessionalAddedEvent);
            expect(user.events).toEqual([
                {
                    type: UserProfessionalAddedEvent.type,
                    timestamp: now,
                    professionalId: professionalId2,
                    userId: user.id,
                },
            ]);
        });

        it('should ignore adding the same professional twice', () => {
            const professionalId = ProfessionalId.generate();

            const user = fakeUser({
                professionals: [professionalId],
            });

            user.addToProfessional(professionalId);

            expect(user.professionals).toEqual([professionalId]);

            expect(user.events).toEqual([]);
        });
    });

    describe('when removed from a professional', () => {
        it('should emit a user-professional-removed event', () => {
            const professionalId = ProfessionalId.generate();

            const user = fakeUser({
                professionals: [professionalId],
            });

            user.removeFromProfessional(professionalId);

            expect(user.professionals).toEqual([]);

            expect(user.events[0]).toBeInstanceOf(UserProfessionalRemovedEvent);
            expect(user.events).toEqual([
                {
                    type: UserProfessionalRemovedEvent.type,
                    timestamp: now,
                    professionalId,
                    userId: user.id,
                },
            ]);
        });

        it('should ignore removing a professional that is not in the list', () => {
            const professionalId = ProfessionalId.generate();

            const user = fakeUser({
                professionals: [professionalId],
            });

            user.removeFromProfessional(ProfessionalId.generate());

            expect(user.professionals).toEqual([professionalId]);

            expect(user.events).toEqual([]);
        });
    });

    describe('on deletion', () => {
        it('should emit a user-deleted event', () => {
            const user = fakeUser();

            user.delete();

            expect(user.events).toEqual([
                {
                    type: UserDeletedEvent.type,
                    timestamp: now,
                    user,
                },
            ]);

            expect(user.events[0]).toBeInstanceOf(UserDeletedEvent);
        });
    });

    it.each([
        {
            email: Email.create('john_doe@example.com'),
        },
        {
            email: null,
        },
    ])('should be serializable', async (customValues) => {
        const user = fakeUser({
            ...customValues,
            username: Username.create('john_doe'),
            password: await ObfuscatedPassword.obfuscate('Pa$$w0rd'),
            name: 'John Doe',
            globalRole: GlobalRole.NONE,
            professionals: [ProfessionalId.generate()],
        });

        expect(user.toJSON()).toEqual({
            id: user.id.toJSON(),
            username: 'john_doe',
            email: customValues.email?.toString() ?? null,
            name: 'John Doe',
            globalRole: 'NONE',
            professionals: [user.professionals[0].toJSON()],
            createdAt: user.createdAt.toJSON(),
            updatedAt: user.updatedAt.toJSON(),
        });
    });
});

describe('A user ID', () => {
    it('can be created from a string', () => {
        const uuid = '2d441fac-b959-4dfb-9fc1-803fced58e58';
        const id = UserId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(UserId.generate()).toBeInstanceOf(UserId);
    });
});
