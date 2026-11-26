import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {WhatsAppQrCodeDto} from '@application/whatsapp-config/dtos';
import {PreconditionException} from '@domain/@shared/exceptions';
import {WhatsAppConfigExceptions} from '@domain/notification/notification.exceptions';
import {EvolutionApiClient} from '@infrastructure/whatsapp/evolution-api.client';
import {ConfigureWhatsAppWebhookService} from './configure-whatsapp-webhook.service';
import {assertEnabled, instanceNameOf, toError} from './whatsapp-instance';

/** Asks Evolution for a fresh QR code to (re)pair the clinic instance. */
@Injectable()
export class GetWhatsAppQrcodeService implements ApplicationService<undefined, WhatsAppQrCodeDto> {
    constructor(
        private readonly client: EvolutionApiClient,
        private readonly webhook: ConfigureWhatsAppWebhookService
    ) {}

    async execute({actor}: Command): Promise<WhatsAppQrCodeDto> {
        assertEnabled(this.client);

        let qrcode: {base64?: string; pairingCode?: string | null};

        try {
            qrcode = await this.client.connectInstance(instanceNameOf(actor.clinicId));
        } catch (error) {
            throw new PreconditionException(WhatsAppConfigExceptions.connect_failed, toError(error));
        }

        // Reconnecting is also when an instance created before delivery tracking gets its webhook.
        await this.webhook.configure(actor.clinicId);

        return {base64: qrcode.base64, pairingCode: qrcode.pairingCode};
    }
}
