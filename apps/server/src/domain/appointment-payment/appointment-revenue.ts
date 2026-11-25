import {brl, brlFromCents} from '@domain/appointment-payment/brl';
import {AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import {AppointmentStatus} from '@domain/appointment/entities';
import {InsuranceClaimStatus} from '@domain/insurance-claim/entities';

export type RevenuePayment = {
    status: AppointmentPaymentStatus;
    paymentMethod: PaymentMethod;
    amountBrl: number;
    paidAt: Date | null;
    insuranceClaim: {
        status: InsuranceClaimStatus;
        submittedAmountBrl: number;
        approvedAmountBrl: number | null;
        resolvedAt: Date | null;
    } | null;
};

export type AppointmentRevenue = {
    expectedBrl: number;
    receivedBrl: number;
    pendingBrl: number;
    paymentMethod: PaymentMethod | null;
    status: AppointmentPaymentStatus;
    paidAt: Date | null;
    insuranceClaimStatus: InsuranceClaimStatus | null;
};

export function isPrepaidAppointmentMethod(method: PaymentMethod): boolean {
    return method === PaymentMethod.PACKAGE || method === PaymentMethod.SUBSCRIPTION;
}

export function projectAppointmentRevenue(
    appointmentStatus: AppointmentStatus,
    procedurePriceInCents: number | null,
    payment: RevenuePayment | null
): AppointmentRevenue | null {
    if (payment === null) {
        if (
            procedurePriceInCents === null ||
            appointmentStatus === AppointmentStatus.CANCELLED ||
            appointmentStatus === AppointmentStatus.NO_SHOW
        ) {
            return null;
        }

        const amount = brlFromCents(procedurePriceInCents);
        const status = amount === 0 ? AppointmentPaymentStatus.EXEMPT : AppointmentPaymentStatus.PENDING;

        return revenue(amount, 0, null, status);
    }

    const {paymentMethod, status, paidAt} = payment;

    if (status === AppointmentPaymentStatus.REFUNDED || status === AppointmentPaymentStatus.EXEMPT) {
        return revenue(0, 0, paymentMethod, status);
    }

    if (paymentMethod === PaymentMethod.COURTESY) {
        return revenue(0, 0, paymentMethod, AppointmentPaymentStatus.EXEMPT);
    }

    if (isPrepaidAppointmentMethod(paymentMethod)) {
        return revenue(0, 0, paymentMethod, status);
    }

    if (paymentMethod === PaymentMethod.INSURANCE && payment.insuranceClaim !== null) {
        return {
            ...projectInsuranceClaimRevenue(payment.insuranceClaim),
            insuranceClaimStatus: payment.insuranceClaim.status,
        };
    }

    return revenue(
        payment.amountBrl,
        status === AppointmentPaymentStatus.PAID ? payment.amountBrl : 0,
        paymentMethod,
        status,
        status === AppointmentPaymentStatus.PAID ? paidAt : null
    );
}

function projectInsuranceClaimRevenue(claim: NonNullable<RevenuePayment['insuranceClaim']>): AppointmentRevenue {
    const method = PaymentMethod.INSURANCE;
    const approved = claim.approvedAmountBrl ?? 0;

    if (claim.status === InsuranceClaimStatus.PAID || claim.status === InsuranceClaimStatus.PARTIALLY_PAID) {
        return revenue(approved, approved, method, AppointmentPaymentStatus.PAID, claim.resolvedAt);
    }

    if (claim.status === InsuranceClaimStatus.DENIED || claim.status === InsuranceClaimStatus.CANCELLED) {
        return revenue(0, 0, method, AppointmentPaymentStatus.EXEMPT);
    }

    const received = claim.status === InsuranceClaimStatus.APPEALED ? approved : 0;

    return revenue(claim.submittedAmountBrl, received, method, AppointmentPaymentStatus.PENDING);
}

function revenue(
    expected: number,
    received: number,
    paymentMethod: PaymentMethod | null,
    status: AppointmentPaymentStatus,
    paidAt: Date | null = null
): AppointmentRevenue {
    const expectedAmount = brl(expected);
    const receivedAmount = brl(received);
    const balance = expectedAmount.minus(receivedAmount);

    return {
        expectedBrl: expectedAmount.toNumber(),
        receivedBrl: receivedAmount.toNumber(),
        pendingBrl: balance.isPositive() ? balance.toNumber() : 0,
        paymentMethod,
        status,
        paidAt,
        insuranceClaimStatus: null,
    };
}
