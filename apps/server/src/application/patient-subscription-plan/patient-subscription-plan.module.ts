import {Module} from '@nestjs/common';
import {PatientSubscriptionPlanController} from '@application/patient-subscription-plan/controllers/patient-subscription-plan.controller';
import {
    CreatePatientSubscriptionPlanService,
    DeactivatePatientSubscriptionPlanService,
    ListPatientSubscriptionPlansService,
    UpdatePatientSubscriptionPlanService,
} from '@application/patient-subscription-plan/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [PatientSubscriptionPlanController],
    providers: [
        CreatePatientSubscriptionPlanService,
        ListPatientSubscriptionPlansService,
        UpdatePatientSubscriptionPlanService,
        DeactivatePatientSubscriptionPlanService,
    ],
})
export class PatientSubscriptionPlanModule {}
