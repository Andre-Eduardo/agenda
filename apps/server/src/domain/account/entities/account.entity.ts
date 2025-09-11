import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import {AccountChangedEvent, AccountCreatedEvent, AccountDeletedEvent} from '../events';

export type AccountProps = EntityProps<Account>;
export type CreateAccount = CreateEntity<Account>;
export type UpdateAccount = Omit<Partial<AccountProps>, 'companyId'>;

export enum AccountType {
    INTERNAL = 'INTERNAL',
    BANK = 'BANK',
}

export class Account extends AggregateRoot<AccountId> {
    companyId: CompanyId;
    name: string;
    type: AccountType;
    bankId?: number | null;
    agencyNumber?: number | null;
    agencyDigit?: string | null;
    accountDigit?: string | null;
    accountNumber?: number | null;

    constructor(props: AllEntityProps<Account>) {
        super(props);
        this.companyId = props.companyId;
        this.name = props.name;
        this.type = props.type;
        this.bankId = props.bankId;
        this.agencyNumber = props.agencyNumber;
        this.agencyDigit = props.agencyDigit;
        this.accountDigit = props.accountDigit;
        this.accountNumber = props.accountNumber;
        this.validate();
    }

    static create(props: CreateAccount): Account {
        const accountId = AccountId.generate();
        const now = new Date();

        const account = new Account({
            ...props,
            id: accountId,
            bankId: props.bankId ?? null,
            agencyNumber: props.agencyNumber ?? null,
            agencyDigit: props.agencyDigit ?? null,
            accountDigit: props.accountDigit ?? null,
            accountNumber: props.accountNumber ?? null,
            createdAt: now,
            updatedAt: now,
        });

        account.addEvent(
            new AccountCreatedEvent({
                companyId: props.companyId,
                account,
                timestamp: now,
            })
        );

        return account;
    }

    change(props: UpdateAccount): void {
        const oldAccount = new Account(this);

        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        if (props.type !== undefined) {
            this.type = props.type;
        }

        if (props.bankId !== undefined) {
            this.bankId = props.bankId;
        }

        if (props.agencyNumber !== undefined) {
            this.agencyNumber = props.agencyNumber;
        }

        if (props.agencyDigit !== undefined) {
            this.agencyDigit = props.agencyDigit;
        }

        if (props.accountDigit !== undefined) {
            this.accountDigit = props.accountDigit;
        }

        if (props.accountNumber !== undefined) {
            this.accountNumber = props.accountNumber;
        }

        this.validate('type');

        this.addEvent(
            new AccountChangedEvent({
                companyId: this.companyId,
                oldState: oldAccount,
                newState: this,
            })
        );
    }

    delete(): void {
        this.addEvent(new AccountDeletedEvent({companyId: this.companyId, account: this}));
    }

    toJSON(): EntityJson<Account> {
        return {
            id: this.id.toString(),
            companyId: this.companyId.toJSON(),
            name: this.name,
            type: this.type,
            bankId: this.bankId,
            agencyNumber: this.agencyNumber,
            agencyDigit: this.agencyDigit,
            accountDigit: this.accountDigit,
            accountNumber: this.accountNumber,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof AccountProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (this.name.length < 1) {
                throw new InvalidInputException('Account name must be at least 1 character long.');
            }
        }

        if (fields.length === 0 || fields.includes('type')) {
            if (this.type === AccountType.INTERNAL) {
                if (
                    this.bankId !== null ||
                    this.agencyNumber !== null ||
                    this.agencyDigit !== null ||
                    this.accountDigit !== null ||
                    this.accountNumber !== null
                ) {
                    throw new InvalidInputException('Internal accounts cannot have bank information.');
                }
            }
        }
    }
}

export class AccountId extends EntityId<'AccountId'> {
    static from(value: string): AccountId {
        return new AccountId(value);
    }

    static generate(): AccountId {
        return new AccountId();
    }
}
