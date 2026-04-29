import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "@application/@shared/auth/public.decorator";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import { EnvConfigService } from "@infrastructure/config";
import { AsaasWebhookService } from "@application/payment/webhooks/asaas-webhook.service";

@ApiTags("Webhooks")
@Controller("webhooks")
export class AsaasWebhookController {
  constructor(
    private readonly webhookService: AsaasWebhookService,
    private readonly configService: EnvConfigService,
  ) {}

  @ApiOperation({
    summary: "Asaas payment webhook receiver",
    responses: [
      { status: 200, description: "Processed" },
      { status: 401, description: "Invalid webhook token" },
    ],
  })
  @Public()
  @Post("asaas")
  @HttpCode(HttpStatus.OK)
  async handleAsaasWebhook(
    @Headers("asaas-access-token") token: string,
    @Body() payload: unknown,
  ): Promise<void> {
    const expectedToken = this.configService.asaas.webhookToken;

    if (!expectedToken || token !== expectedToken) {
      throw new UnauthorizedException({
        code: "INVALID_WEBHOOK_TOKEN",
        message: "Webhook token inválido.",
      });
    }

    await this.webhookService.handleWebhook(payload);
  }
}
