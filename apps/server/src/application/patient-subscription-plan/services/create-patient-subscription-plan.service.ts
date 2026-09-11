import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {
    CreatePatientSubscriptionPlanDto,
    PatientSubscriptionPlanDto,
} from '@application/patient-subscription-plan/dtos';
import {EventDispatcher} from '@domain/event';
import {PatientSubscriptionPlan} from '@domain/patient-subscription-plan/entities';
import {PatientSubscriptionPlanRepository} from '@domain/patient-subscription-plan/patient-subscription-plan.repository';

@Injectable()
export class CreatePatientSubscriptionPlanService implements ApplicationService<
    CreatePatientSubscriptionPlanDto,
    PatientSubscriptionPlanDto
> {
    constructor(
        private readonly subscriptionPlanRepository: PatientSubscriptionPlanRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreatePatientSubscriptionPlanDto>): Promise<PatientSubscriptionPlanDto> {
        const plan = PatientSubscriptionPlan.create({
            clinicId: actor.clinicId,
            name: payload.name,
            description: payload.description ?? null,
            monthlyAppointmentQuota: payload.monthlyAppointmentQuota,
            priceBrl: payload.priceBrl,
        });

        await this.subscriptionPlanRepository.save(plan);

        this.eventDispatcher.dispatch(actor, plan);

        return new PatientSubscriptionPlanDto(plan);
    }
}
