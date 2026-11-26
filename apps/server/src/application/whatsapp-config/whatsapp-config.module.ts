import {Module} from '@nestjs/common';
import {WhatsAppConfigController} from '@application/whatsapp-config/controllers';
import {
    ConfigureWhatsAppWebhookService,
    CreateWhatsAppConfigService,
    DeleteWhatsAppConfigService,
    GetWhatsAppConfigService,
    GetWhatsAppQrcodeService,
    LogoutWhatsAppConfigService,
} from '@application/whatsapp-config/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';
import {EvolutionApiClient} from '@infrastructure/whatsapp/evolution-api.client';

@Module({
    imports: [InfrastructureModule],
    controllers: [WhatsAppConfigController],
    providers: [
        EvolutionApiClient,
        ConfigureWhatsAppWebhookService,
        GetWhatsAppConfigService,
        CreateWhatsAppConfigService,
        GetWhatsAppQrcodeService,
        LogoutWhatsAppConfigService,
        DeleteWhatsAppConfigService,
    ],
})
export class WhatsAppConfigModule {}
