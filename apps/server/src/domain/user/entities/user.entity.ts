import type {AllEntityProps, CreateEntity, EntityProps, EntityJson} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {AccessDeniedException, AccessDeniedReason, InvalidInputException} from '../../@shared/exceptions';
import type {Email} from '../../@shared/value-objects';
import {GlobalRole} from '../../auth';
import type {CompanyId} from '../../company/entities';
import {
    UserSignedUpEvent,
    UserChangedEvent,
    UserPasswordChangedEvent,
    UserDeletedEvent,
    UserSignedInEvent,
    UserSignedOutEvent,
    UserCreatedEvent,
    UserCompanyRemovedEvent,
    UserCompanyAddedEvent,
} from '../events';
import type {Username} from '../value-objects';
import {ObfuscatedPassword} from '../value-objects';

export type UserProps = EntityProps<User>;
export type CreateUser = Override<Omit<CreateEntity<User>, 'globalRole'>, {email?: Email; password: string}>;
export type SignUpUser = Override<Omit<CreateUser, 'companies'>, {email: Email}>;
export type UpdateUser = Override<Omit<Partial<UserProps>, 'password'>, {email?: Email}>;

export class User extends AggregateRoot<UserId> {
    username: Username;
    email: Email | null;
    password: ObfuscatedPassword;
    firstName: string;
    lastName: string | null;
    globalRole: GlobalRole;
    companies: CompanyId[];

    constructor(props: AllEntityProps<User>) {
        super(props);
        this.username = props.username;
        this.email = props.email;
        this.password = props.password;
        this.firstName = props.firstName;
        this.lastName = props.lastName;
        this.globalRole = props.globalRole;
        this.companies = props.companies;
        this.validate();
    }

    static async signUp(props: SignUpUser): Promise<User> {
        const userId = UserId.generate();
        const now = new Date();

        const user = new User({
            ...props,
            id: userId,
            password: await ObfuscatedPassword.obfuscate(props.password),
            lastName: props.lastName ?? null,
            globalRole: GlobalRole.OWNER,
            companies: [],
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
            lastName: props.lastName ?? null,
            globalRole: GlobalRole.NONE,
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

        if (props.firstName !== undefined) {
            this.firstName = props.firstName;
            this.validate('firstName');
        }

        if (props.lastName !== undefined) {
            this.lastName = props.lastName;
            this.validate('lastName');
        }

        this.addEvent(new UserChangedEvent({oldState: oldUser, newState: this}));
    }

    async changePassword(newPassword: string): Promise<void> {
        this.password = await ObfuscatedPassword.obfuscate(newPassword);

        this.addEvent(new UserPasswordChangedEvent({userId: this.id}));
    }

    addToCompany(companyId: CompanyId): void {
        if (this.companies.some((id) => id.equals(companyId))) {
            return;
        }

        this.companies.push(companyId);

        this.addEvent(new UserCompanyAddedEvent({userId: this.id, companyId}));
    }

    removeFromCompany(companyId: CompanyId): void {
        const index = this.companies.findIndex((id) => id.equals(companyId));

        if (index === -1) {
            return;
        }

        this.companies.splice(index, 1);

        this.addEvent(new UserCompanyRemovedEvent({userId: this.id, companyId}));
    }

    delete(): void {
        this.addEvent(new UserDeletedEvent({user: this}));
    }

    toJSON(): Omit<EntityJson<User>, 'password'> {
        return {
            id: this.id.toJSON(),
            username: this.username.toJSON(),
            email: this.email?.toJSON() ?? null,
            firstName: this.firstName,
            lastName: this.lastName,
            globalRole: this.globalRole,
            companies: this.companies.map((companyId) => companyId.toJSON()),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof UserProps>): void {
        if (fields.length === 0 || fields.includes('firstName')) {
            if (this.firstName.length < 1) {
                throw new InvalidInputException('First name must be at least 1 character long.');
            }

            if (/\s/.test(this.firstName)) {
                throw new InvalidInputException('First name must not contain whitespace.');
            }
        }

        if (fields.length === 0 || fields.includes('lastName')) {
            if (this.lastName != null && this.lastName.length < 1) {
                throw new InvalidInputException('Last name must be at least 1 character long.');
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
