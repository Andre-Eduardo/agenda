import {projectAppointmentRevenue, type RevenuePayment} from '@domain/appointment-payment/appointment-revenue';
import {AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import {AppointmentStatus} from '@domain/appointment/entities';
import {InsuranceClaimStatus} from '@domain/insurance-claim/entities';

const paidAt = new Date('2027-02-01T09:00:00.000Z');
const pendingPayment: RevenuePayment = {
    status: AppointmentPaymentStatus.PENDING,
    paymentMethod: PaymentMethod.PIX,
    amountBrl: 123.45,
    paidAt: null,
    insuranceClaim: null,
};

describe('appointment revenue', () => {
    it('previews the procedure price before any payment is filed', () => {
        expect(projectAppointmentRevenue(AppointmentStatus.SCHEDULED, 12345, null)).toEqual({
            expectedBrl: 123.45,
            receivedBrl: 0,
            pendingBrl: 123.45,
            paymentMethod: null,
            status: AppointmentPaymentStatus.PENDING,
            paidAt: null,
            insuranceClaimStatus: null,
        });
    });

    it('identifies a zero price without a collectible balance', () => {
        expect(projectAppointmentRevenue(AppointmentStatus.SCHEDULED, 0, null)).toMatchObject({
            expectedBrl: 0,
            pendingBrl: 0,
            status: AppointmentPaymentStatus.EXEMPT,
        });
    });

    it.each([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW])(
        'removes the forecast when an unpaid appointment is %s',
        (status) => expect(projectAppointmentRevenue(status, 12345, null)).toBeNull()
    );

    it('keeps unpriced legacy appointments without a payment out of revenue', () => {
        expect(projectAppointmentRevenue(AppointmentStatus.SCHEDULED, null, null)).toBeNull();
    });

    it('recognizes the recorded amount if it differs from the procedure price', () => {
        expect(projectAppointmentRevenue(AppointmentStatus.COMPLETED, 17500, pendingPayment)).toMatchObject({
            expectedBrl: 123.45,
            receivedBrl: 0,
            pendingBrl: 123.45,
        });
    });

    it('retains actual receipts for an appointment later cancelled', () => {
        expect(
            projectAppointmentRevenue(AppointmentStatus.CANCELLED, 17500, {
                ...pendingPayment,
                status: AppointmentPaymentStatus.PAID,
                paidAt,
            })
        ).toMatchObject({expectedBrl: 123.45, receivedBrl: 123.45, pendingBrl: 0, paidAt});
    });

    it.each([PaymentMethod.PACKAGE, PaymentMethod.SUBSCRIPTION, PaymentMethod.COURTESY])(
        'shows %s without counting a separate charge for the appointment',
        (paymentMethod) => {
            expect(
                projectAppointmentRevenue(AppointmentStatus.COMPLETED, 17500, {
                    ...pendingPayment,
                    paymentMethod,
                    status: AppointmentPaymentStatus.PAID,
                    paidAt,
                })
            ).toMatchObject({
                paymentMethod,
                expectedBrl: 0,
                receivedBrl: 0,
                pendingBrl: 0,
            });
        }
    );

    it('recognizes the approved insurance amount after partial settlement', () => {
        expect(
            projectAppointmentRevenue(AppointmentStatus.COMPLETED, 15000, {
                ...pendingPayment,
                paymentMethod: PaymentMethod.INSURANCE,
                insuranceClaim: {
                    status: InsuranceClaimStatus.PARTIALLY_PAID,
                    submittedAmountBrl: 150,
                    approvedAmountBrl: 110.12,
                    resolvedAt: paidAt,
                },
            })
        ).toMatchObject({expectedBrl: 110.12, receivedBrl: 110.12, pendingBrl: 0, paidAt});
    });

    it('keeps only the disputed portion pending during an insurance appeal', () => {
        expect(
            projectAppointmentRevenue(AppointmentStatus.COMPLETED, 15000, {
                ...pendingPayment,
                paymentMethod: PaymentMethod.INSURANCE,
                insuranceClaim: {
                    status: InsuranceClaimStatus.APPEALED,
                    submittedAmountBrl: 150.15,
                    approvedAmountBrl: 110.12,
                    resolvedAt: null,
                },
            })
        ).toMatchObject({
            expectedBrl: 150.15,
            receivedBrl: 110.12,
            pendingBrl: 40.03,
            status: AppointmentPaymentStatus.PENDING,
        });
    });

    it('preserves a paid insurance record without a linked claim', () => {
        expect(
            projectAppointmentRevenue(AppointmentStatus.COMPLETED, null, {
                ...pendingPayment,
                paymentMethod: PaymentMethod.INSURANCE,
                status: AppointmentPaymentStatus.PAID,
                paidAt,
            })
        ).toMatchObject({expectedBrl: 123.45, receivedBrl: 123.45, pendingBrl: 0, paidAt});
    });

    it('drops the balance for a refunded payment even if its related claim was paid', () => {
        expect(
            projectAppointmentRevenue(AppointmentStatus.COMPLETED, 15000, {
                ...pendingPayment,
                paymentMethod: PaymentMethod.INSURANCE,
                status: AppointmentPaymentStatus.REFUNDED,
                insuranceClaim: {
                    status: InsuranceClaimStatus.PAID,
                    submittedAmountBrl: 150,
                    approvedAmountBrl: 150,
                    resolvedAt: paidAt,
                },
            })
        ).toMatchObject({
            expectedBrl: 0,
            receivedBrl: 0,
            pendingBrl: 0,
            status: AppointmentPaymentStatus.REFUNDED,
            paidAt: null,
        });
    });
});
