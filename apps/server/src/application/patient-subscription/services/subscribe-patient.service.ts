import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PatientSubscriptionDto, SubscribePatientDto} from '@application/patient-subscription/dtos';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {PatientSubscriptionPlanRepository} from '@domain/patient-subscription-plan/patient-subscription-plan.repository';
import {PatientSubscription} from '@domain/patient-subscription/entities';
import {PatientSubscriptionRepository} from '@domain/patient-subscription/patient-subscription.repository';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class SubscribePatientService implements ApplicationService<SubscribePatientDto, PatientSubscriptionDto> {
    constructor(
        private readonly subscriptionRepository: PatientSubscriptionRepository,
        private readonly subscriptionPlanRepository: PatientSubscriptionPlanRepository,
        private readonly patientRepository: PatientRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<SubscribePatientDto>): Promise<PatientSubscriptionDto> {
        const patient = await this.patientRepository.findById(payload.patientId, actor.clinicId);

        if (patient === null) {
            throw new ResourceNotFoundException('patient.not_found', payload.patientId.toString());
        }

        const plan = await this.subscriptionPlanRepository.findById(payload.subscriptionPlanId);

        if (plan === null || !plan.clinicId.equals(actor.clinicId)) {
            throw new ResourceNotFoundException(
                'patient_subscription_plan.not_found',
                payload.subscriptionPlanId.toString()
            );
        }

        if (!plan.isActive) {
            throw new PreconditionException('patient_subscription_plan.inactive');
        }

        const existingActive = await this.subscriptionRepository.findActiveByPatientId(payload.patientId);

        if (existingActive !== null) {
            throw new PreconditionException('patient_subscription.already_active');
        }

        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date(currentPeriodStart);

        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

        const subscription = PatientSubscription.create({
            clinicId: actor.clinicId,
            patientId: payload.patientId,
            subscriptionPlanId: plan.id,
            planNameSnapshot: plan.name,
            monthlyQuotaSnapshot: plan.monthlyAppointmentQuota,
            priceBrlSnapshot: plan.priceBrl,
            currentPeriodStart,
            currentPeriodEnd,
        });

        await this.subscriptionRepository.save(subscription);

        this.eventDispatcher.dispatch(actor, subscription);

        return new PatientSubscriptionDto(subscription);
    }
}
