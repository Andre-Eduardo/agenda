import {Module} from '@nestjs/common';
import {PatientSubscriptionController} from '@application/patient-subscription/controllers/patient-subscription.controller';
import {RenewPatientSubscriptionsJob} from '@application/patient-subscription/jobs/renew-patient-subscriptions.job';
import {
    CancelPatientSubscriptionService,
    ListPatientSubscriptionsService,
    SubscribePatientService,
} from '@application/patient-subscription/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [PatientSubscriptionController],
    providers: [
        ListPatientSubscriptionsService,
        SubscribePatientService,
        CancelPatientSubscriptionService,
        RenewPatientSubscriptionsJob,
    ],
})
export class PatientSubscriptionModule {}
