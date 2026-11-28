import {InvalidInputException, PreconditionException} from '@domain/@shared/exceptions';
import {AppointmentPaymentId, PaymentMethod} from '@domain/appointment-payment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {FinancialAccountId} from '@domain/financial-account/entities';
import {
    AccountMovementCategory,
    AccountMovementDirection,
    FinancialEntry,
    FinancialEntryExceptions,
} from '@domain/financial-entry/entities';

describe('FinancialEntry', () => {
    const memberId = ClinicMemberId.generate();
    const cashDrawer = FinancialAccountId.generate();
    const bank = FinancialAccountId.generate();

    function openEntry(amountCents = 20000): FinancialEntry {
        return FinancialEntry.openAppointmentReceivable({
            clinicId: ClinicId.generate(),
            appointmentPaymentId: AppointmentPaymentId.generate(),
            amountCents,
            competencyDate: new Date('2026-11-27T12:00:00.000Z'),
            createdByMemberId: memberId,
        });
    }

    it('settles when the parts reach the amount, even with different methods', () => {
        const entry = openEntry();

        entry.receive(
            [
                {accountId: bank, paymentMethod: PaymentMethod.PIX, amountCents: 12000},
                {accountId: cashDrawer, paymentMethod: PaymentMethod.CASH, amountCents: 8000},
            ],
            memberId
        );

        expect(entry.receivedCents()).toBe(20000);
        expect(entry.remainingCents()).toBe(0);
        expect(entry.isSettled()).toBe(true);
        expect(entry.receivedMethods()).toEqual([PaymentMethod.PIX, PaymentMethod.CASH]);
        expect(entry.takePendingMovements()).toHaveLength(2);
        expect(entry.takePendingMovements()).toHaveLength(0);
    });

    it('keeps the entry open after a partial receipt', () => {
        const entry = openEntry();

        entry.receive([{accountId: bank, paymentMethod: PaymentMethod.PIX, amountCents: 5000}], memberId);

        expect(entry.isSettled()).toBe(false);
        expect(entry.remainingCents()).toBe(15000);
    });

    it('rejects receipts above what is left to receive', () => {
        const entry = openEntry();

        entry.receive([{accountId: bank, paymentMethod: PaymentMethod.PIX, amountCents: 15000}], memberId);

        expect(() =>
            entry.receive([{accountId: bank, paymentMethod: PaymentMethod.PIX, amountCents: 6000}], memberId)
        ).toThrowWithMessage(PreconditionException, FinancialEntryExceptions.receipt_exceeds_remaining);
    });

    it('rejects methods that do not move money and non-positive parts', () => {
        const entry = openEntry();

        expect(() =>
            entry.receive([{accountId: bank, paymentMethod: PaymentMethod.INSURANCE, amountCents: 100}], memberId)
        ).toThrowWithMessage(InvalidInputException, FinancialEntryExceptions.method_not_allowed);
        expect(() =>
            entry.receive([{accountId: bank, paymentMethod: PaymentMethod.PIX, amountCents: 0}], memberId)
        ).toThrowWithMessage(InvalidInputException, FinancialEntryExceptions.invalid_amount);
        expect(() => entry.receive([], memberId)).toThrowWithMessage(
            InvalidInputException,
            FinancialEntryExceptions.parts_required
        );
    });

    it('refunds every standing receipt with one outgoing movement each, keeping the reason', () => {
        const entry = openEntry();
        const [pix, cash] = entry.receive(
            [
                {accountId: bank, paymentMethod: PaymentMethod.PIX, amountCents: 12000},
                {accountId: cashDrawer, paymentMethod: PaymentMethod.CASH, amountCents: 8000},
            ],
            memberId
        );

        const refunds = entry.refundAll('  Paciente desistiu  ', memberId);

        expect(refunds).toHaveLength(2);
        expect(refunds.map((movement) => movement.reversesMovementId)).toEqual([pix.id, cash.id]);
        expect(refunds.every((movement) => movement.direction === AccountMovementDirection.OUT)).toBe(true);
        expect(refunds.every((movement) => movement.category === AccountMovementCategory.REFUND)).toBe(true);
        expect(refunds[0].reason).toBe('Paciente desistiu');
        expect(refunds[1].accountId).toEqual(cashDrawer);
        expect(entry.receivedCents()).toBe(0);
        expect(entry.receivedMethods()).toEqual([]);
        expect(() => entry.refundAll('De novo', memberId)).toThrowWithMessage(
            PreconditionException,
            FinancialEntryExceptions.nothing_to_refund
        );
    });

    it('requires a reason to refund', () => {
        const entry = openEntry();

        entry.receive([{accountId: bank, paymentMethod: PaymentMethod.PIX, amountCents: 20000}], memberId);

        expect(() => entry.refundAll('   ', memberId)).toThrowWithMessage(
            InvalidInputException,
            FinancialEntryExceptions.refund_reason_required
        );
    });

    it('does not lower the amount below what was received', () => {
        const entry = openEntry();

        entry.receive([{accountId: bank, paymentMethod: PaymentMethod.PIX, amountCents: 10000}], memberId);

        expect(() => entry.changeAmount(9999)).toThrowWithMessage(
            PreconditionException,
            FinancialEntryExceptions.amount_below_received
        );

        entry.changeAmount(10000);

        expect(entry.isSettled()).toBe(true);
    });

    it('does not accept receipts once settled', () => {
        const entry = openEntry(0);

        expect(entry.isSettled()).toBe(true);
        expect(() =>
            entry.receive([{accountId: bank, paymentMethod: PaymentMethod.PIX, amountCents: 100}], memberId)
        ).toThrowWithMessage(PreconditionException, FinancialEntryExceptions.already_settled);
    });
});
