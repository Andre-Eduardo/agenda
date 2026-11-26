import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PreconditionException} from '@domain/@shared/exceptions';
import {WhatsAppConfigExceptions} from '@domain/notification/notification.exceptions';
import {EvolutionApiClient} from '@infrastructure/whatsapp/evolution-api.client';
import {assertEnabled, instanceNameOf, toError} from './whatsapp-instance';

/** Disconnects the paired phone, keeping the instance so it can be paired again. */
@Injectable()
export class LogoutWhatsAppConfigService implements ApplicationService {
    constructor(private readonly client: EvolutionApiClient) {}

    async execute({actor}: Command): Promise<void> {
        assertEnabled(this.client);

        try {
            await this.client.logoutInstance(instanceNameOf(actor.clinicId));
        } catch (error) {
            throw new PreconditionException(WhatsAppConfigExceptions.logout_failed, toError(error));
        }
    }
}
