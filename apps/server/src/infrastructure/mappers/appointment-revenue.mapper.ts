import type {Prisma} from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import type {RevenuePayment} from '@domain/appointment-payment/appointment-revenue';
import {AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import {InsuranceClaimStatus} from '@domain/insurance-claim/entities';

export const revenuePaymentSelect = {
    id: true,
    appointmentId: true,
    clinicId: true,
    status: true,
    paymentMethod: true,
    amountBrl: true,
    paidAt: true,
    deletedAt: true,
    insurancePlan: {select: {clinicId: true, name: true}},
    insuranceClaim: {
        select: {
            clinicId: true,
            claimStatus: true,
            submittedAmountBrl: true,
            approvedAmountBrl: true,
            resolvedAt: true,
        },
    },
    financialEntry: {
        select: {
            clinicId: true,
            amountCents: true,
            movements: {select: {direction: true, amountCents: true}},
        },
    },
} satisfies Prisma.AppointmentPaymentSelect;

export type RevenuePaymentModel = Prisma.AppointmentPaymentGetPayload<{select: typeof revenuePaymentSelect}>;

export function toRevenuePayment(row: RevenuePaymentModel): RevenuePayment {
    const {insuranceClaim: claim, financialEntry: entry} = row;

    return {
        status: toEnum(AppointmentPaymentStatus, row.status),
        paymentMethod: toEnum(PaymentMethod, row.paymentMethod),
        amountBrl: row.amountBrl,
        paidAt: row.paidAt,
        insuranceClaim:
            claim?.clinicId === row.clinicId
                ? {
                      status: toEnum(InsuranceClaimStatus, claim.claimStatus),
                      submittedAmountBrl: claim.submittedAmountBrl,
                      approvedAmountBrl: claim.approvedAmountBrl,
                      resolvedAt: claim.resolvedAt,
                  }
                : null,
        ledger:
            entry?.clinicId === row.clinicId
                ? {
                      amountCents: entry.amountCents,
                      receivedCents: entry.movements.reduce(
                          (total, movement) =>
                              total + (movement.direction === 'IN' ? movement.amountCents : -movement.amountCents),
                          0
                      ),
                  }
                : null,
    };
}
