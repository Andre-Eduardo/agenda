import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {WhatsAppConfigDto} from '@application/whatsapp-config/dtos';
import {PreconditionException} from '@domain/@shared/exceptions';
import {WhatsAppConfigExceptions} from '@domain/notification/notification.exceptions';
import {WhatsAppConnectionStatus} from '@domain/notification/whatsapp-connection-status';
import {EvolutionApiClient} from '@infrastructure/whatsapp/evolution-api.client';
import {instanceNameOf, isNotFound, phoneNumberOf, toError} from './whatsapp-instance';

/** Lists the clinic WhatsApp instance (zero or one). Empty when Evolution is not configured. */
@Injectable()
export class GetWhatsAppConfigService implements ApplicationService<undefined, WhatsAppConfigDto[]> {
    constructor(private readonly client: EvolutionApiClient) {}

    async execute({actor}: Command): Promise<WhatsAppConfigDto[]> {
        if (!this.client.isEnabled) {
            return [];
        }

        const instanceName = instanceNameOf(actor.clinicId);

        try {
            const instances = await this.client.fetchInstances(instanceName);

            return instances
                .filter((instance) => instance.name === instanceName)
                .map((instance) => ({
                    clinicId: actor.clinicId.toString(),
                    status: instance.connectionStatus ?? WhatsAppConnectionStatus.CLOSE,
                    phoneNumber: phoneNumberOf(instance),
                }));
        } catch (error) {
            if (isNotFound(error)) {
                return [];
            }

            throw new PreconditionException(WhatsAppConfigExceptions.fetch_failed, toError(error));
        }
    }
}
