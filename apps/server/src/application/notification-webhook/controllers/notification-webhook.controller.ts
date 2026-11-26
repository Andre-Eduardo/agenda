import {Body, Controller, Headers, HttpCode, HttpStatus, Post} from '@nestjs/common';
import {ApiExcludeEndpoint, ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Public} from '@application/@shared/auth/public.decorator';
import {ValidatedParam} from '@application/@shared/validation';
import {ReceiveEvolutionWebhookService} from '@application/notification-webhook/services/receive-evolution-webhook.service';
import {ReceiveSesWebhookService} from '@application/notification-webhook/services/receive-ses-webhook.service';
import {ClinicId} from '@domain/clinic/entities';
import {EVOLUTION_WEBHOOK_TOKEN_HEADER} from '@infrastructure/whatsapp/evolution-webhook-token';

/**
 * Provider callbacks for reminder delivery tracking (L2-04). Public routes authenticated by the
 * provider itself: a per-clinic HMAC token (Evolution) or the SNS message signature (SES).
 * Excluded from the OpenAPI document: the frontend never calls them.
 */
@ApiTags('Webhooks')
@Controller('webhooks')
export class NotificationWebhookController {
    constructor(
        private readonly evolutionWebhookService: ReceiveEvolutionWebhookService,
        private readonly sesWebhookService: ReceiveSesWebhookService
    ) {}

    @ApiExcludeEndpoint()
    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('evolution/:clinicId')
    async receiveEvolutionWebhook(
        @ValidatedParam(
            'clinicId',
            z
                .string()
                .uuid()
                .transform((v) => ClinicId.from(v))
        )
        clinicId: ClinicId,
        @Headers(EVOLUTION_WEBHOOK_TOKEN_HEADER) token: string | undefined,
        @Body() body: unknown
    ): Promise<void> {
        await this.evolutionWebhookService.receive({clinicId, token, body});
    }

    /** SNS posts JSON with `Content-Type: text/plain`, so the body may arrive as a string. */
    @ApiExcludeEndpoint()
    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('ses')
    async receiveSesWebhook(@Body() body: unknown): Promise<void> {
        await this.sesWebhookService.receive(body);
    }
}
