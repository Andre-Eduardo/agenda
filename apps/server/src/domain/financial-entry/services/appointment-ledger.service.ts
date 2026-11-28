import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {brlFromCents} from '@domain/appointment-payment/brl';
import {AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import type {AppointmentPayment} from '@domain/appointment-payment/entities';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import {FinancialAccount, FinancialAccountExceptions, FinancialAccountType} from '@domain/financial-account/entities';
import type {FinancialAccountId} from '@domain/financial-account/entities';
import {FinancialAccountRepository} from '@domain/financial-account/financial-account.repository';
import {FinancialEntry, FinancialEntryExceptions, isLedgerPaymentMethod} from '@domain/financial-entry/entities';
import type {AccountMovement, ReceiptPart} from '@domain/financial-entry/entities';
import {FinancialEntryRepository} from '@domain/financial-entry/financial-entry.repository';

export type ReceiptRequest = {
    paymentMethod: PaymentMethod;
    amountCents: number;
    accountId?: FinancialAccountId | null;
};

/** Conta padrão que recebe cada forma de pagamento quando nenhuma conta é escolhida. */
export const DEFAULT_ACCOUNT_TYPE_BY_METHOD: Partial<Record<PaymentMethod, FinancialAccountType>> = {
    [PaymentMethod.CASH]: FinancialAccountType.CASH_DRAWER,
    [PaymentMethod.PIX]: FinancialAccountType.BANK,
    [PaymentMethod.BANK_TRANSFER]: FinancialAccountType.BANK,
    [PaymentMethod.CREDIT_CARD]: FinancialAccountType.CARD_MACHINE,
    [PaymentMethod.DEBIT_CARD]: FinancialAccountType.CARD_MACHINE,
};

/**
 * Liga o pagamento da consulta ao livro-caixa: abre a obrigação, registra recebimentos
 * (inclusive em partes e com formas diferentes), estorna e mantém o status do pagamento
 * alinhado ao que de fato entrou. Ver docs/financial-ledger.md.
 */
@Injectable()
export class AppointmentLedger {
    constructor(
        private readonly financialAccountRepository: FinancialAccountRepository,
        private readonly financialEntryRepository: FinancialEntryRepository
    ) {}

    find(payment: AppointmentPayment): Promise<FinancialEntry | null> {
        return this.financialEntryRepository.findByAppointmentPaymentId(payment.id);
    }

    /** Abre a obrigação do pagamento, se ainda não existir. */
    async open(
        payment: AppointmentPayment,
        amountCents: number,
        competencyDate: Date,
        memberId: ClinicMemberId
    ): Promise<FinancialEntry> {
        const existing = await this.find(payment);

        if (existing !== null) return existing;

        const entry = FinancialEntry.openAppointmentReceivable({
            clinicId: payment.clinicId,
            appointmentPaymentId: payment.id,
            amountCents,
            competencyDate,
            createdByMemberId: memberId,
        });

        await this.financialEntryRepository.save(entry);

        return entry;
    }

    async receive(
        payment: AppointmentPayment,
        entry: FinancialEntry,
        receipts: ReceiptRequest[],
        memberId: ClinicMemberId
    ): Promise<AccountMovement[]> {
        if (
            payment.status === AppointmentPaymentStatus.REFUNDED ||
            payment.status === AppointmentPaymentStatus.EXEMPT
        ) {
            throw new PreconditionException(FinancialEntryExceptions.already_settled);
        }

        const parts: ReceiptPart[] = [];

        for (const receipt of receipts) {
            const account = await this.resolveAccount(
                payment.clinicId,
                receipt.paymentMethod,
                receipt.accountId ?? null
            );

            parts.push({accountId: account.id, paymentMethod: receipt.paymentMethod, amountCents: receipt.amountCents});
        }

        const movements = entry.receive(parts, memberId);

        await this.financialEntryRepository.save(entry);
        this.reflect(payment, entry);

        return movements;
    }

    async refund(entry: FinancialEntry, reason: string, memberId: ClinicMemberId): Promise<AccountMovement[]> {
        const movements = entry.refundAll(reason, memberId);

        await this.financialEntryRepository.save(entry);

        return movements;
    }

    async changeAmount(payment: AppointmentPayment, entry: FinancialEntry, amountCents: number): Promise<void> {
        entry.changeAmount(amountCents);
        await this.financialEntryRepository.save(entry);
        this.reflect(payment, entry);
    }

    /** Alinha forma, valor, status e data do pagamento ao livro-caixa. */
    reflect(payment: AppointmentPayment, entry: FinancialEntry): void {
        payment.reflectLedger({
            amountBrl: brlFromCents(entry.amountCents),
            isSettled: entry.isSettled(),
            lastReceivedAt: entry.lastReceivedAt(),
            receivedMethods: entry.receivedMethods(),
        });
    }

    async resolveAccount(
        clinicId: ClinicId,
        method: PaymentMethod,
        accountId: FinancialAccountId | null
    ): Promise<FinancialAccount> {
        const type = DEFAULT_ACCOUNT_TYPE_BY_METHOD[method];

        if (type === undefined || !isLedgerPaymentMethod(method)) {
            throw new PreconditionException(FinancialEntryExceptions.method_not_allowed);
        }

        if (accountId !== null) {
            const account = await this.financialAccountRepository.findById(accountId);

            if (account === null || !account.clinicId.equals(clinicId)) {
                throw new ResourceNotFoundException(FinancialAccountExceptions.not_found, accountId.toString());
            }

            account.assertCanReceive();

            return account;
        }

        return this.defaultAccount(clinicId, type);
    }

    /** Conta padrão do tipo, criada na primeira vez que a clínica precisa dela. */
    async defaultAccount(clinicId: ClinicId, type: FinancialAccountType): Promise<FinancialAccount> {
        const existing = await this.financialAccountRepository.findDefault(clinicId, type);

        if (existing !== null) return existing;

        const account = FinancialAccount.createDefault(clinicId, type);

        await this.financialAccountRepository.save(account);

        return account;
    }
}
