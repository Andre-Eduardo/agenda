import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {
    PatientSubscriptionPlanDto,
    UpdatePatientSubscriptionPlanDto,
} from '@application/patient-subscription-plan/dtos';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {PatientSubscriptionPlanRepository} from '@domain/patient-subscription-plan/patient-subscription-plan.repository';

@Injectable()
export class UpdatePatientSubscriptionPlanService implements ApplicationService<
    UpdatePatientSubscriptionPlanDto,
    PatientSubscriptionPlanDto
> {
    constructor(
        private readonly subscriptionPlanRepository: PatientSubscriptionPlanRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({
        actor,
        payload: {id, ...props},
    }: Command<UpdatePatientSubscriptionPlanDto>): Promise<PatientSubscriptionPlanDto> {
        const plan = await this.subscriptionPlanRepository.findById(id);

        if (plan === null) {
            throw new ResourceNotFoundException('patient_subscription_plan.not_found', id.toString());
        }

        if (!plan.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Subscription plan does not belong to the current clinic.');
        }

        plan.updateDetails(props);

        await this.subscriptionPlanRepository.save(plan);

        this.eventDispatcher.dispatch(actor, plan);

        return new PatientSubscriptionPlanDto(plan);
    }
}
