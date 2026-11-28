import {Entity, type AllEntityProps, type EntityJson} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import type {PaymentMethod} from '@domain/appointment-payment/entities';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {FinancialAccountId} from '@domain/financial-account/entities';
import type {FinancialEntryId} from '@domain/financial-entry/entities/financial-entry.entity';

export enum AccountMovementDirection {
    IN = 'IN',
    OUT = 'OUT',
}

export enum AccountMovementCategory {
    PAYMENT = 'PAYMENT',
    REFUND = 'REFUND',
    ADJUSTMENT = 'ADJUSTMENT',
}

/**
 * Dinheiro que de fato entrou ou saiu de uma conta. Append-only: nunca é editado nem apagado;
 * uma correção é um movimento novo que aponta para o original em `reversesMovementId`.
 */
export class AccountMovement extends Entity<AccountMovementId> {
    readonly clinicId: ClinicId;
    readonly entryId: FinancialEntryId;
    readonly accountId: FinancialAccountId;
    readonly direction: AccountMovementDirection;
    readonly category: AccountMovementCategory;
    readonly paymentMethod: PaymentMethod;
    /** Sempre positivo; a direção diz se entra ou sai. */
    readonly amountCents: number;
    readonly movedAt: Date;
    readonly reason: string | null;
    readonly reversesMovementId: AccountMovementId | null;
    readonly responsibleMemberId: ClinicMemberId;

    constructor(props: AllEntityProps<AccountMovement>) {
        super(props);
        this.clinicId = props.clinicId;
        this.entryId = props.entryId;
        this.accountId = props.accountId;
        this.direction = props.direction;
        this.category = props.category;
        this.paymentMethod = props.paymentMethod;
        this.amountCents = props.amountCents;
        this.movedAt = props.movedAt;
        this.reason = props.reason;
        this.reversesMovementId = props.reversesMovementId;
        this.responsibleMemberId = props.responsibleMemberId;
    }

    /** Valor com sinal: positivo para entrada, negativo para saída. */
    signedCents(): number {
        return this.direction === AccountMovementDirection.IN ? this.amountCents : -this.amountCents;
    }

    toJSON(): EntityJson<AccountMovement> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            entryId: this.entryId.toJSON(),
            accountId: this.accountId.toJSON(),
            direction: this.direction,
            category: this.category,
            paymentMethod: this.paymentMethod,
            amountCents: this.amountCents,
            movedAt: this.movedAt.toJSON(),
            reason: this.reason,
            reversesMovementId: this.reversesMovementId?.toJSON() ?? null,
            responsibleMemberId: this.responsibleMemberId.toJSON(),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: null,
        };
    }
}

export class AccountMovementId extends EntityId<'AccountMovementId'> {
    static from(value: string): AccountMovementId {
        return new AccountMovementId(value);
    }

    static generate(): AccountMovementId {
        return new AccountMovementId();
    }
}
