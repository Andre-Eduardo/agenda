import {AggregateRoot, type AllEntityProps, type CreateEntity, type EntityJson} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import {InvalidInputException, PreconditionException} from '@domain/@shared/exceptions';
import type {ClinicId} from '@domain/clinic/entities';

export enum FinancialAccountType {
    /** Caixa físico (dinheiro) da recepção. */
    CASH_DRAWER = 'CASH_DRAWER',
    BANK = 'BANK',
    /** Maquininha / adquirente de cartão. */
    CARD_MACHINE = 'CARD_MACHINE',
    /** Carteira digital (ex.: Asaas). */
    DIGITAL_WALLET = 'DIGITAL_WALLET',
}

export const FinancialAccountExceptions = {
    not_found: 'financial_account.not_found',
    inactive: 'financial_account.inactive',
    cannot_deactivate_default: 'financial_account.cannot_deactivate_default',
    name_required: 'financial_account.name_required',
} as const;

export type CreateFinancialAccount = CreateEntity<FinancialAccount>;
export type ChangeFinancialAccount = Partial<Pick<FinancialAccount, 'name' | 'active'>>;

/** Nome padrão das contas criadas automaticamente para cada clínica. */
export const DEFAULT_FINANCIAL_ACCOUNT_NAMES: Record<FinancialAccountType, string> = {
    [FinancialAccountType.CASH_DRAWER]: 'Caixa',
    [FinancialAccountType.BANK]: 'Conta bancária',
    [FinancialAccountType.CARD_MACHINE]: 'Maquininha',
    [FinancialAccountType.DIGITAL_WALLET]: 'Carteira digital',
};

/**
 * Onde o dinheiro da clínica fica: caixa físico, banco, maquininha ou carteira digital.
 * O saldo é derivado dos movimentos (AccountMovement), nunca guardado aqui.
 */
export class FinancialAccount extends AggregateRoot<FinancialAccountId> {
    clinicId: ClinicId;
    name: string;
    type: FinancialAccountType;
    active: boolean;
    /** Conta padrão do tipo: recebe as baixas feitas sem conta escolhida. */
    isDefault: boolean;

    constructor(props: AllEntityProps<FinancialAccount>) {
        super(props);
        this.clinicId = props.clinicId;
        this.name = props.name;
        this.type = props.type;
        this.active = props.active;
        this.isDefault = props.isDefault;
        this.validate();
    }

    static create(props: CreateFinancialAccount): FinancialAccount {
        const now = new Date();

        return new FinancialAccount({
            clinicId: props.clinicId,
            name: props.name.trim(),
            type: props.type,
            active: props.active ?? true,
            isDefault: props.isDefault ?? false,
            id: FinancialAccountId.generate(),
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    static createDefault(clinicId: ClinicId, type: FinancialAccountType): FinancialAccount {
        return FinancialAccount.create({
            clinicId,
            type,
            name: DEFAULT_FINANCIAL_ACCOUNT_NAMES[type],
            active: true,
            isDefault: true,
        });
    }

    change(props: ChangeFinancialAccount): void {
        if (props.name !== undefined) this.name = props.name.trim();

        if (props.active !== undefined) {
            if (!props.active && this.isDefault) {
                throw new PreconditionException(FinancialAccountExceptions.cannot_deactivate_default);
            }

            this.active = props.active;
        }

        this.validate();
        this.update();
    }

    assertCanReceive(): void {
        if (!this.active || this.isDeleted()) {
            throw new PreconditionException(FinancialAccountExceptions.inactive);
        }
    }

    private validate(): void {
        if (this.name.trim().length === 0) {
            throw new InvalidInputException(FinancialAccountExceptions.name_required);
        }
    }

    toJSON(): EntityJson<FinancialAccount> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            name: this.name,
            type: this.type,
            active: this.active,
            isDefault: this.isDefault,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class FinancialAccountId extends EntityId<'FinancialAccountId'> {
    static from(value: string): FinancialAccountId {
        return new FinancialAccountId(value);
    }

    static generate(): FinancialAccountId {
        return new FinancialAccountId();
    }
}
