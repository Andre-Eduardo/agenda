import {Module} from '@nestjs/common';
import {AppointmentReminderModule} from '@application/appointment-reminder/appointment-reminder.module';
import {NotificationWebhookController} from '@application/notification-webhook/controllers/notification-webhook.controller';
import {PatientCommunicationPreferenceModule} from '@application/patient-communication-preference/patient-communication-preference.module';
import {ReceiveEvolutionWebhookService} from '@application/notification-webhook/services/receive-evolution-webhook.service';
import {ReceiveSesWebhookService} from '@application/notification-webhook/services/receive-ses-webhook.service';
import {SnsMessageVerifier} from '@infrastructure/aws/sns-message-verifier';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule, AppointmentReminderModule, PatientCommunicationPreferenceModule],
    controllers: [NotificationWebhookController],
    providers: [SnsMessageVerifier, ReceiveEvolutionWebhookService, ReceiveSesWebhookService],
})
export class NotificationWebhookModule {}
