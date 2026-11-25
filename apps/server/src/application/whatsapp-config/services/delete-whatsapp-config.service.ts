import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PreconditionException} from '@domain/@shared/exceptions';
import {WhatsAppConfigExceptions} from '@domain/notification/notification.exceptions';
import {EvolutionApiClient} from '@infrastructure/whatsapp/evolution-api.client';
import {assertEnabled, instanceNameOf, isNotFound, toError} from './whatsapp-instance';

/** Removes the clinic instance from Evolution. Removing one that no longer exists is a no-op. */
@Injectable()
export class DeleteWhatsAppConfigService implements ApplicationService {
    constructor(private readonly client: EvolutionApiClient) {}

    async execute({actor}: Command): Promise<void> {
        assertEnabled(this.client);

        try {
            await this.client.deleteInstance(instanceNameOf(actor.clinicId));
        } catch (error) {
            if (isNotFound(error)) return;

            throw new PreconditionException(WhatsAppConfigExceptions.delete_failed, toError(error));
        }
    }
}
