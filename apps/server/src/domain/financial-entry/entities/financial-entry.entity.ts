import {AggregateRoot, type AllEntityProps, type EntityJson} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import {InvalidInputException, PreconditionException} from '@domain/@shared/exceptions';
import type {AppointmentPaymentId} from '@domain/appointment-payment/entities';
import {PaymentMethod} from '@domain/appointment-payment/entities';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {FinancialAccountId} from '@domain/financial-account/entities';
import {
    AccountMovement,
    AccountMovementCategory,
    AccountMovementDirection,
    AccountMovementId,
} from '@domain/financial-entry/entities/account-movement.entity';

export enum FinancialEntryDirection {
    RECEIVABLE = 'RECEIVABLE',
    PAYABLE = 'PAYABLE',
}

export enum FinancialEntryOriginType {
    APPOINTMENT = 'APPOINTMENT',
}

export const FinancialEntryExceptions = {
    not_found: 'financial_entry.not_found',
    invalid_amount: 'financial_entry.invalid_amount',
    receipt_exceeds_remaining: 'financial_entry.receipt_exceeds_remaining',
    already_settled: 'financial_entry.already_settled',
    nothing_to_refund: 'financial_entry.nothing_to_refund',
    refund_reason_required: 'financial_entry.refund_reason_required',
    amount_below_received: 'financial_entry.amount_below_received',
    has_receipts: 'financial_entry.has_receipts',
    method_not_allowed: 'financial_entry.method_not_allowed',
    parts_required: 'financial_entry.parts_required',
} as const;

/** Formas que movem dinheiro de verdade; as demais (convênio, pacote, assinatura, cortesia) não. */
export const LEDGER_PAYMENT_METHODS: readonly PaymentMethod[] = [
    PaymentMethod.CASH,
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BANK_TRANSFER,
];

export function isLedgerPaymentMethod(method: PaymentMethod): boolean {
    return LEDGER_PAYMENT_METHODS.includes(method);
}

export type ReceiptPart = {
    accountId: FinancialAccountId;
    paymentMethod: PaymentMethod;
    amountCents: number;
};

export type OpenAppointmentReceivable = {
    clinicId: ClinicId;
    appointmentPaymentId: AppointmentPaymentId;
    amountCents: number;
    competencyDate: Date;
    createdByMemberId: ClinicMemberId;
};

/**
 * Obrigação a receber (ou a pagar). Agrega os movimentos que a liquidam:
 * recebido = entradas − saídas; está quitada quando o recebido alcança o valor.
 * Ver docs/financial-ledger.md.
 */
export class FinancialEntry extends AggregateRoot<FinancialEntryId> {
    clinicId: ClinicId;
    direction: FinancialEntryDirection;
    originType: FinancialEntryOriginType;
    appointmentPaymentId: AppointmentPaymentId | null;
    description: string;
    amountCents: number;
    competencyDate: Date;
    createdByMemberId: ClinicMemberId;
    movements: AccountMovement[];
    /** Movimentos criados nesta instância e ainda não persistidos. */
    private pendingMovements: AccountMovement[] = [];

    constructor(props: AllEntityProps<FinancialEntry>) {
        super(props);
        this.clinicId = props.clinicId;
        this.direction = props.direction;
        this.originType = props.originType;
        this.appointmentPaymentId = props.appointmentPaymentId;
        this.description = props.description;
        this.amountCents = props.amountCents;
        this.competencyDate = props.competencyDate;
        this.createdByMemberId = props.createdByMemberId;
        this.movements = [...props.movements];
        assertCents(this.amountCents, true);
    }

    static openAppointmentReceivable(props: OpenAppointmentReceivable): FinancialEntry {
        const now = new Date();

        return new FinancialEntry({
            id: FinancialEntryId.generate(),
            clinicId: props.clinicId,
            direction: FinancialEntryDirection.RECEIVABLE,
            originType: FinancialEntryOriginType.APPOINTMENT,
            appointmentPaymentId: props.appointmentPaymentId,
            description: 'Atendimento',
            amountCents: props.amountCents,
            competencyDate: props.competencyDate,
            createdByMemberId: props.createdByMemberId,
            movements: [],
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    /** Valor já recebido, líquido de estornos. */
    receivedCents(): number {
        return this.movements.reduce((total, movement) => total + movement.signedCents(), 0);
    }

    remainingCents(): number {
        return Math.max(this.amountCents - this.receivedCents(), 0);
    }

    isSettled(): boolean {
        return this.receivedCents() >= this.amountCents;
    }

    /** Data do último recebimento, ou null se nada foi recebido. */
    lastReceivedAt(): Date | null {
        const receipts = this.movements.filter((movement) => movement.direction === AccountMovementDirection.IN);

        if (receipts.length === 0) return null;

        return receipts.reduce(
            (latest, movement) => (movement.movedAt > latest ? movement.movedAt : latest),
            receipts[0].movedAt
        );
    }

    /** Distinct methods among the receipts that are still standing. */
    receivedMethods(): PaymentMethod[] {
        return [
            ...new Set(
                this.movements
                    .filter((movement) => movement.category === AccountMovementCategory.PAYMENT)
                    .filter((movement) => this.netOf(movement) > 0)
                    .map((movement) => movement.paymentMethod)
            ),
        ];
    }

    takePendingMovements(): AccountMovement[] {
        const pending = this.pendingMovements;

        this.pendingMovements = [];

        return pending;
    }

    receive(parts: ReceiptPart[], responsibleMemberId: ClinicMemberId, movedAt = new Date()): AccountMovement[] {
        if (parts.length === 0) {
            throw new InvalidInputException(FinancialEntryExceptions.parts_required);
        }

        if (this.isSettled()) {
            throw new PreconditionException(FinancialEntryExceptions.already_settled);
        }

        const total = parts.reduce((sum, part) => {
            assertCents(part.amountCents, false);

            if (!isLedgerPaymentMethod(part.paymentMethod)) {
                throw new InvalidInputException(FinancialEntryExceptions.method_not_allowed);
            }

            return sum + part.amountCents;
        }, 0);

        if (total > this.remainingCents()) {
            throw new PreconditionException(FinancialEntryExceptions.receipt_exceeds_remaining);
        }

        return parts.map((part) =>
            this.append({
                accountId: part.accountId,
                direction: AccountMovementDirection.IN,
                category: AccountMovementCategory.PAYMENT,
                paymentMethod: part.paymentMethod,
                amountCents: part.amountCents,
                movedAt,
                reason: null,
                reversesMovementId: null,
                responsibleMemberId,
            })
        );
    }

    /** Devolve tudo o que foi recebido: um movimento de saída para cada recebimento ainda em pé. */
    refundAll(reason: string, responsibleMemberId: ClinicMemberId, movedAt = new Date()): AccountMovement[] {
        const trimmed = reason.trim();

        if (trimmed.length === 0) {
            throw new InvalidInputException(FinancialEntryExceptions.refund_reason_required);
        }

        const refunds = this.movements
            .filter((movement) => movement.direction === AccountMovementDirection.IN)
            .map((movement) => ({movement, net: this.netOf(movement)}))
            .filter(({net}) => net > 0)
            .map(({movement, net}) =>
                this.append({
                    accountId: movement.accountId,
                    direction: AccountMovementDirection.OUT,
                    category: AccountMovementCategory.REFUND,
                    paymentMethod: movement.paymentMethod,
                    amountCents: net,
                    movedAt,
                    reason: trimmed,
                    reversesMovementId: movement.id,
                    responsibleMemberId,
                })
            );

        if (refunds.length === 0) {
            throw new PreconditionException(FinancialEntryExceptions.nothing_to_refund);
        }

        return refunds;
    }

    changeAmount(amountCents: number): void {
        assertCents(amountCents, true);

        if (amountCents < this.receivedCents()) {
            throw new PreconditionException(FinancialEntryExceptions.amount_below_received);
        }

        this.amountCents = amountCents;
        this.update();
    }

    /** What is left of a receipt after the refunds that point at it. */
    private netOf(movement: AccountMovement): number {
        const reversed = this.movements
            .filter((other) => other.reversesMovementId?.equals(movement.id) === true)
            .reduce((total, other) => total + other.amountCents, 0);

        return movement.amountCents - reversed;
    }

    private append(
        props: Omit<
            AllEntityProps<AccountMovement>,
            'id' | 'clinicId' | 'entryId' | 'createdAt' | 'updatedAt' | 'deletedAt'
        >
    ): AccountMovement {
        const now = new Date();
        const movement = new AccountMovement({
            ...props,
            id: AccountMovementId.generate(),
            clinicId: this.clinicId,
            entryId: this.id,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        this.movements.push(movement);
        this.pendingMovements.push(movement);
        this.update();

        return movement;
    }

    toJSON(): EntityJson<FinancialEntry> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            direction: this.direction,
            originType: this.originType,
            appointmentPaymentId: this.appointmentPaymentId?.toJSON() ?? null,
            description: this.description,
            amountCents: this.amountCents,
            competencyDate: this.competencyDate.toJSON(),
            createdByMemberId: this.createdByMemberId.toJSON(),
            movements: this.movements.map((movement) => movement.toJSON()),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: null,
        };
    }
}

function assertCents(value: number, allowZero: boolean): void {
    if (!Number.isSafeInteger(value) || value < 0 || (!allowZero && value === 0)) {
        throw new InvalidInputException(FinancialEntryExceptions.invalid_amount);
    }
}

export class FinancialEntryId extends EntityId<'FinancialEntryId'> {
    static from(value: string): FinancialEntryId {
        return new FinancialEntryId(value);
    }

    static generate(): FinancialEntryId {
        return new FinancialEntryId();
    }
}
