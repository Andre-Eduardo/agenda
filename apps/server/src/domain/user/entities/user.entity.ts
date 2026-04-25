import type {AllEntityProps, CreateEntity, EntityProps, EntityJson} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {AccessDeniedException, AccessDeniedReason, InvalidInputException} from '../../@shared/exceptions';
import type {Email} from '../../@shared/value-objects';
import {GlobalRole} from '../../auth';
import type {ClinicMemberId} from '../../clinic-member/entities';
import {
    UserSignedUpEvent,
    UserChangedEvent,
    UserPasswordChangedEvent,
    UserDeletedEvent,
    UserSignedInEvent,
    UserSignedOutEvent,
    UserCreatedEvent,
    UserClinicMemberAddedEvent,
    UserClinicMemberRemovedEvent,
} from '../events';
import type {Username} from '../value-objects';
import {ObfuscatedPassword} from '../value-objects';

export type UserProps = EntityProps<User>;
export type CreateUser = Override<Omit<CreateEntity<User>, 'globalRole'>, {email?: Email; password: string}>;
export type SignUpUser = Override<Omit<CreateUser, 'clinicMembers'>, {email: Email}>;
export type UpdateUser = Override<Omit<Partial<UserProps>, 'password'>, {email?: Email}>;

export class User extends AggregateRoot<UserId> {
    username: Username;
    email: Email | null;
    password: ObfuscatedPassword;
    name: string;
    globalRole: GlobalRole;
    clinicMembers: ClinicMemberId[];

    constructor(props: AllEntityProps<User>) {
        super(props);
        this.username = props.username;
        this.email = props.email;
        this.password = props.password;
        this.name = props.name;
        this.globalRole = props.globalRole;
        this.clinicMembers = props.clinicMembers;
        this.validate();
    }

    static async signUp(props: SignUpUser): Promise<User> {
        const userId = UserId.generate();
        const now = new Date();

        const user = new User({
            ...props,
            id: userId,
            password: await ObfuscatedPassword.obfuscate(props.password),
            name: props.name,
            globalRole: GlobalRole.OWNER,
            clinicMembers: [],
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        user.addEvent(new UserSignedUpEvent({user, timestamp: now}));

        return user;
    }

    static async create(props: CreateUser): Promise<User> {
        const userId = UserId.generate();
        const now = new Date();

        const user = new User({
            ...props,
            id: userId,
            email: props.email ?? null,
            password: await ObfuscatedPassword.obfuscate(props.password),
            name: props.name,
            globalRole: GlobalRole.NONE,
            clinicMembers: [],
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        user.addEvent(new UserCreatedEvent({user, timestamp: now}));

        return user;
    }

    async signIn(password: string): Promise<void> {
        if (!(await this.password.verify(password))) {
            throw new AccessDeniedException('Incorrect password.', AccessDeniedReason.BAD_CREDENTIALS);
        }

        this.addEvent(new UserSignedInEvent({userId: this.id}));
    }

    signOut(): void {
        this.addEvent(new UserSignedOutEvent({userId: this.id}));
    }

    change(props: UpdateUser): void {
        const oldUser = new User(this);

        if (props.username !== undefined) {
            this.username = props.username;
        }

        if (props.email !== undefined) {
            this.email = props.email;
        }

        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        this.addEvent(new UserChangedEvent({oldState: oldUser, newState: this}));
    }

    async changePassword(newPassword: string): Promise<void> {
        this.password = await ObfuscatedPassword.obfuscate(newPassword);

        this.addEvent(new UserPasswordChangedEvent({userId: this.id}));
    }

    addClinicMember(clinicMemberId: ClinicMemberId): void {
        if (this.clinicMembers.some((id) => id.equals(clinicMemberId))) {
            return;
        }

        this.clinicMembers.push(clinicMemberId);
        this.addEvent(new UserClinicMemberAddedEvent({userId: this.id, clinicMemberId}));
    }

    removeClinicMember(clinicMemberId: ClinicMemberId): void {
        const index = this.clinicMembers.findIndex((id) => id.equals(clinicMemberId));

        if (index === -1) {
            return;
        }

        this.clinicMembers.splice(index, 1);
        this.addEvent(new UserClinicMemberRemovedEvent({userId: this.id, clinicMemberId}));
    }

    delete(): void {
        this.addEvent(new UserDeletedEvent({user: this}));
    }

    toJSON(): Omit<EntityJson<User>, 'password'> {
        return {
            id: this.id.toJSON(),
            username: this.username.toJSON(),
            email: this.email?.toJSON() ?? null,
            name: this.name,
            globalRole: this.globalRole,
            clinicMembers: this.clinicMembers.map((clinicMemberId) => clinicMemberId.toJSON()),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }

    private validate(...fields: Array<keyof UserProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (this.name.length < 1) {
                throw new InvalidInputException('Name must be at least 1 character long.');
            }
        }
    }
}

export class UserId extends EntityId<'UserId'> {
    static from(value: string): UserId {
        return new UserId(value);
    }

    static generate(): UserId {
        return new UserId();
    }
}
