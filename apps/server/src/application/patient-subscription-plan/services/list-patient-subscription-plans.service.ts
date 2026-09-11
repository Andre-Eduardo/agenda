import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PatientSubscriptionPlanDto} from '@application/patient-subscription-plan/dtos';
import {PatientSubscriptionPlanRepository} from '@domain/patient-subscription-plan/patient-subscription-plan.repository';

@Injectable()
export class ListPatientSubscriptionPlansService implements ApplicationService<
    undefined,
    PatientSubscriptionPlanDto[]
> {
    constructor(private readonly subscriptionPlanRepository: PatientSubscriptionPlanRepository) {}

    async execute({actor}: Command): Promise<PatientSubscriptionPlanDto[]> {
        const plans = await this.subscriptionPlanRepository.findByClinicId(actor.clinicId);

        return plans.map((p) => new PatientSubscriptionPlanDto(p));
    }
}
