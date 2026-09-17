import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {AppointmentPaymentDto, RegisterPaymentDto} from '@application/appointment-payment/dtos';
import {InvalidInputException, PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {AppointmentPayment, AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {AppointmentId, AppointmentStatus} from '@domain/appointment/entities';
import {EventDispatcher} from '@domain/event';
import {InsuranceClaim} from '@domain/insurance-claim/entities';
import {InsuranceClaimRepository} from '@domain/insurance-claim/insurance-claim.repository';
import {PackagePlanRepository} from '@domain/package-plan/package-plan.repository';
import {PatientInsuranceEnrollmentRepository} from '@domain/patient-insurance-enrollment/patient-insurance-enrollment.repository';
import {PatientPackageCredit, PatientPackageCreditEventType} from '@domain/patient-package/entities';
import {PatientPackageCreditRepository} from '@domain/patient-package/patient-package-credit.repository';
import {PatientPackageRepository} from '@domain/patient-package/patient-package.repository';
import {
    PatientSubscription,
    PatientSubscriptionStatus,
    PatientSubscriptionUsage,
} from '@domain/patient-subscription/entities';
import {PatientSubscriptionUsageRepository} from '@domain/patient-subscription/patient-subscription-usage.repository';
import {PatientSubscriptionRepository} from '@domain/patient-subscription/patient-subscription.repository';
import {PatientRepository} from '@domain/patient/patient.repository';

export type RegisterPaymentCommand = RegisterPaymentDto & {appointmentId: AppointmentId};

@Injectable()
export class RegisterPaymentService implements ApplicationService<RegisterPaymentCommand, AppointmentPaymentDto> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly appointmentPaymentRepository: AppointmentPaymentRepository,
        private readonly patientRepository: PatientRepository,
        private readonly patientInsuranceEnrollmentRepository: PatientInsuranceEnrollmentRepository,
        private readonly insuranceClaimRepository: InsuranceClaimRepository,
        private readonly patientPackageRepository: PatientPackageRepository,
        private readonly packagePlanRepository: PackagePlanRepository,
        private readonly patientPackageCreditRepository: PatientPackageCreditRepository,
        private readonly patientSubscriptionRepository: PatientSubscriptionRepository,
        private readonly patientSubscriptionUsageRepository: PatientSubscriptionUsageRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    @Transactional()
    async execute({actor, payload}: Command<RegisterPaymentCommand>): Promise<AppointmentPaymentDto> {
        const {
            appointmentId,
            paymentMethod,
            amountBrl,
            status,
            insurancePlanId,
            insuranceAuthCode,
            patientPackageId,
            patientSubscriptionId,
            notes,
        } = payload;

        const appointment = await this.appointmentRepository.findById(appointmentId);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', appointmentId.toString());
        }

        if (!appointment.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Appointment does not belong to the current clinic.');
        }

        if (appointment.status === AppointmentStatus.CANCELLED) {
            throw new PreconditionException('Cannot register payment for a cancelled appointment.');
        }

        const existing = await this.appointmentPaymentRepository.findByAppointmentId(appointmentId);

        if (existing !== null) {
            throw new PreconditionException('Payment already registered for this appointment.');
        }

        if (paymentMethod === PaymentMethod.INSURANCE && !insurancePlanId) {
            throw new InvalidInputException('insurancePlanId is required when paymentMethod is INSURANCE', [
                {field: 'insurancePlanId', reason: 'Required when paymentMethod is INSURANCE'},
            ]);
        }

        // The patient must already be linked to the insurance plan (PatientInsuranceEnrollment) —
        // the claim never infers/creates that link implicitly.
        const enrollment =
            paymentMethod === PaymentMethod.INSURANCE && insurancePlanId
                ? await this.patientInsuranceEnrollmentRepository.findByPatientAndPlan(
                      appointment.patientId,
                      insurancePlanId
                  )
                : null;

        if (paymentMethod === PaymentMethod.INSURANCE && enrollment === null) {
            throw new PreconditionException('patient_insurance_enrollment.not_linked');
        }

        if (enrollment !== null) {
            enrollment.assertCanCoverAppointment(appointment.startAt);
        }

        // A package credit can only be spent on a session that actually happened — this also keeps
        // the source of coverage always explicit (the staff picks it), never inferred automatically.
        if (paymentMethod === PaymentMethod.PACKAGE) {
            if (!patientPackageId) {
                throw new InvalidInputException('patientPackageId is required when paymentMethod is PACKAGE', [
                    {field: 'patientPackageId', reason: 'Required when paymentMethod is PACKAGE'},
                ]);
            }

            if (appointment.status !== AppointmentStatus.COMPLETED) {
                throw new PreconditionException('appointment_payment.package_requires_completed_appointment');
            }

            const patientPackage = await this.patientPackageRepository.findById(patientPackageId);

            if (
                patientPackage === null ||
                !patientPackage.clinicId.equals(actor.clinicId) ||
                !patientPackage.patientId.equals(appointment.patientId)
            ) {
                throw new ResourceNotFoundException('patient_package.not_found', patientPackageId.toString());
            }

            const packagePlan = await this.packagePlanRepository.findById(patientPackage.packagePlanId);

            if (packagePlan === null || !packagePlan.clinicId.equals(actor.clinicId)) {
                throw new ResourceNotFoundException('package_plan.not_found', patientPackage.packagePlanId.toString());
            }

            if (packagePlan.appointmentType !== null && packagePlan.appointmentType !== appointment.type) {
                throw new PreconditionException('patient_package.appointment_type_mismatch');
            }
        }

        // Same rationale as PACKAGE above: a subscription's monthly quota can only be spent on a
        // session that actually happened, and the source is always explicit.
        let subscription: PatientSubscription | null = null;

        if (paymentMethod === PaymentMethod.SUBSCRIPTION) {
            if (!patientSubscriptionId) {
                throw new InvalidInputException(
                    'patientSubscriptionId is required when paymentMethod is SUBSCRIPTION',
                    [{field: 'patientSubscriptionId', reason: 'Required when paymentMethod is SUBSCRIPTION'}]
                );
            }

            if (appointment.status !== AppointmentStatus.COMPLETED) {
                throw new PreconditionException('appointment_payment.subscription_requires_completed_appointment');
            }

            subscription = await this.patientSubscriptionRepository.findById(patientSubscriptionId);

            if (
                subscription === null ||
                !subscription.clinicId.equals(actor.clinicId) ||
                !subscription.patientId.equals(appointment.patientId)
            ) {
                throw new ResourceNotFoundException('patient_subscription.not_found', patientSubscriptionId.toString());
            }

            if (subscription.status !== PatientSubscriptionStatus.ACTIVE) {
                throw new PreconditionException('patient_subscription.not_active');
            }
        }

        const resolvedStatus = status ?? AppointmentPaymentStatus.PAID;
        const paidAt = resolvedStatus === AppointmentPaymentStatus.PAID ? new Date() : null;

        const payment = AppointmentPayment.create({
            clinicId: actor.clinicId,
            appointmentId,
            patientId: appointment.patientId,
            registeredByMemberId: actor.clinicMemberId,
            paymentMethod,
            status: resolvedStatus,
            amountBrl,
            paidAt,
            insurancePlanId: insurancePlanId ?? null,
            insuranceAuthCode: insuranceAuthCode ?? null,
            patientPackageId: patientPackageId ?? null,
            patientSubscriptionId: patientSubscriptionId ?? null,
            notes: notes ?? null,
        });

        await this.appointmentPaymentRepository.save(payment);

        if (enrollment !== null && insurancePlanId) {
            const claim = InsuranceClaim.create({
                clinicId: actor.clinicId,
                appointmentPaymentId: payment.id,
                patientInsuranceEnrollmentId: enrollment.id,
                insurancePlanId,
                authorizationCode: insuranceAuthCode ?? null,
                submittedAmountBrl: amountBrl,
            });

            await this.insuranceClaimRepository.save(claim);
        }

        if (paymentMethod === PaymentMethod.PACKAGE && patientPackageId) {
            // Atomic conditional decrement at the DB level (WHERE remainingCredits > 0 AND status =
            // ACTIVE) — not "load, decrement in memory, save" — so two concurrent registrations for
            // the same package can't both succeed once credits run out.
            const consumed = await this.patientPackageRepository.consumeCredit(patientPackageId);

            if (consumed === null) {
                throw new PreconditionException('patient_package.no_credits_left');
            }

            const credit = PatientPackageCredit.create({
                clinicId: actor.clinicId,
                patientPackageId,
                appointmentPaymentId: payment.id,
                type: PatientPackageCreditEventType.CONSUMPTION,
                delta: -1,
                balanceAfter: consumed.remainingCredits,
                registeredByMemberId: actor.clinicMemberId,
            });

            await this.patientPackageCreditRepository.save(credit);
        }

        if (paymentMethod === PaymentMethod.SUBSCRIPTION && patientSubscriptionId && subscription !== null) {
            const now = new Date();
            const periodYear = now.getFullYear();
            const periodMonth = now.getMonth() + 1;

            let usage = await this.patientSubscriptionUsageRepository.findCurrentPeriod(
                patientSubscriptionId,
                periodYear,
                periodMonth
            );

            // Lazy-create the usage row on first consumption of the period — mirrors UsageRecord.
            if (usage === null) {
                usage = PatientSubscriptionUsage.create({
                    clinicId: actor.clinicId,
                    patientSubscriptionId,
                    periodYear,
                    periodMonth,
                    quotaSnapshot: subscription.monthlyQuotaSnapshot,
                });

                await this.patientSubscriptionUsageRepository.save(usage);
            }

            // Same atomic conditional pattern as package credits (WHERE appointmentsUsed < quotaSnapshot).
            const consumed = await this.patientSubscriptionUsageRepository.consumeAppointment(usage.id);

            if (consumed === null) {
                throw new PreconditionException('patient_subscription.quota_exhausted');
            }
        }

        this.eventDispatcher.dispatch(actor, payment);

        return new AppointmentPaymentDto(payment);
    }
}
