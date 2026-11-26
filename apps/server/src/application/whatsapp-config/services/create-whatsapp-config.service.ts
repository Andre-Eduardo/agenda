import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {CreateWhatsAppConfigDto, WhatsAppConfigDto} from '@application/whatsapp-config/dtos';
import {PreconditionException} from '@domain/@shared/exceptions';
import {WhatsAppConfigExceptions} from '@domain/notification/notification.exceptions';
import {WhatsAppConnectionStatus} from '@domain/notification/whatsapp-connection-status';
import {EvolutionWhatsAppProvider} from '@infrastructure/notification/evolution-whatsapp.provider';
import {EvolutionApiClient, type EvolutionCreateInstanceResponse} from '@infrastructure/whatsapp/evolution-api.client';
import {ConfigureWhatsAppWebhookService} from './configure-whatsapp-webhook.service';
import {assertEnabled, instanceNameOf, toError} from './whatsapp-instance';

/** Creates the clinic WhatsApp instance and returns the QR code to pair it. */
@Injectable()
export class CreateWhatsAppConfigService implements ApplicationService<CreateWhatsAppConfigDto, WhatsAppConfigDto> {
    constructor(
        private readonly client: EvolutionApiClient,
        private readonly webhook: ConfigureWhatsAppWebhookService
    ) {}

    async execute({actor, payload}: Command<CreateWhatsAppConfigDto>): Promise<WhatsAppConfigDto> {
        assertEnabled(this.client);

        const number = EvolutionWhatsAppProvider.toWhatsAppNumber(payload.number.toString());

        let response: EvolutionCreateInstanceResponse;

        try {
            response = await this.client.createInstance(instanceNameOf(actor.clinicId), number);
        } catch (error) {
            throw new PreconditionException(WhatsAppConfigExceptions.create_failed, toError(error));
        }

        await this.webhook.configure(actor.clinicId);

        return {
            clinicId: actor.clinicId.toString(),
            status: response.instance.status ?? response.instance.state ?? WhatsAppConnectionStatus.CONNECTING,
            phoneNumber: number,
            qrcode: response.qrcode
                ? {base64: response.qrcode.base64, pairingCode: response.qrcode.pairingCode}
                : undefined,
        };
    }
}
