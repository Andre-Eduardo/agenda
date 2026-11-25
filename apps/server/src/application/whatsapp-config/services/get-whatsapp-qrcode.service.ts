import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {WhatsAppQrCodeDto} from '@application/whatsapp-config/dtos';
import {PreconditionException} from '@domain/@shared/exceptions';
import {WhatsAppConfigExceptions} from '@domain/notification/notification.exceptions';
import {EvolutionApiClient} from '@infrastructure/whatsapp/evolution-api.client';
import {assertEnabled, instanceNameOf, toError} from './whatsapp-instance';

/** Asks Evolution for a fresh QR code to (re)pair the clinic instance. */
@Injectable()
export class GetWhatsAppQrcodeService implements ApplicationService<undefined, WhatsAppQrCodeDto> {
    constructor(private readonly client: EvolutionApiClient) {}

    async execute({actor}: Command): Promise<WhatsAppQrCodeDto> {
        assertEnabled(this.client);

        try {
            const {base64, pairingCode} = await this.client.connectInstance(instanceNameOf(actor.clinicId));

            return {base64, pairingCode};
        } catch (error) {
            throw new PreconditionException(WhatsAppConfigExceptions.connect_failed, toError(error));
        }
    }
}
