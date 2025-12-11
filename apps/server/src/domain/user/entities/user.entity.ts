import type {AllEntityProps, CreateEntity, EntityProps, EntityJson} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {AccessDeniedException, AccessDeniedReason, InvalidInputException} from '../../@shared/exceptions';
import type {Email} from '../../@shared/value-objects';
import {GlobalRole} from '../../auth';
import type {ProfessionalId} from '../../professional/entities';
import {
    UserSignedUpEvent,
    UserChangedEvent,
    UserPasswordChangedEvent,
    UserDeletedEvent,
    UserSignedInEvent,
    UserSignedOutEvent,
    UserCreatedEvent,
    UserProfessionalAddedEvent,
    UserProfessionalRemovedEvent,
} from '../events';
import type {Username} from '../value-objects';
import {ObfuscatedPassword} from '../value-objects';

export type UserProps = EntityProps<User>;
export type CreateUser = Override<Omit<CreateEntity<User>, 'globalRole'>, {email?: Email; password: string}>;
export type SignUpUser = Override<Omit<CreateUser, 'professionals'>, {email: Email}>;
export type UpdateUser = Override<Omit<Partial<UserProps>, 'password'>, {email?: Email}>;

export class User extends AggregateRoot<UserId> {
    username: Username;
    email: Email | null;
    password: ObfuscatedPassword;
    name: string;
    globalRole: GlobalRole;
    professionals: ProfessionalId[];

    constructor(props: AllEntityProps<User>) {
        super(props);
        this.username = props.username;
        this.email = props.email;
        this.password = props.password;
        this.name = props.name;
        this.globalRole = props.globalRole;
        this.professionals = props.professionals;
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
            professionals: [],
            createdAt: now,
            updatedAt: now,
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
            professionals: [],
            createdAt: now,
            updatedAt: now,
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

    addToProfessional(professionalId: ProfessionalId): void {
        if (this.professionals.some((id) => id.equals(professionalId))) {
            return;
        }

        this.professionals.push(professionalId);
        this.addEvent(new UserProfessionalAddedEvent({userId: this.id, professionalId}));
    }

    removeFromProfessional(professionalId: ProfessionalId): void {
        const index = this.professionals.findIndex((id) => id.equals(professionalId));

        if (index === -1) {
            return;
        }

        this.professionals.splice(index, 1);
        this.addEvent(new UserProfessionalRemovedEvent({userId: this.id, professionalId}));
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
            professionals: this.professionals.map((professionalId) => professionalId.toJSON()),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
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
