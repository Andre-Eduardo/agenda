import {Body, Controller, Delete, Get, HttpCode, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {CreateWhatsAppConfigDto, WhatsAppConfigDto, WhatsAppQrCodeDto} from '@application/whatsapp-config/dtos';
import {
    CreateWhatsAppConfigService,
    DeleteWhatsAppConfigService,
    GetWhatsAppConfigService,
    GetWhatsAppQrcodeService,
    LogoutWhatsAppConfigService,
} from '@application/whatsapp-config/services';
import {Actor} from '@domain/@shared/actor';
import {WhatsAppPermission} from '@domain/auth';

/** WhatsApp instance of the current clinic (from the actor), used to send appointment reminders. */
@ApiTags('WhatsApp')
@Controller('whatsapp-config')
export class WhatsAppConfigController {
    constructor(
        private readonly getWhatsAppConfigService: GetWhatsAppConfigService,
        private readonly createWhatsAppConfigService: CreateWhatsAppConfigService,
        private readonly getWhatsAppQrcodeService: GetWhatsAppQrcodeService,
        private readonly logoutWhatsAppConfigService: LogoutWhatsAppConfigService,
        private readonly deleteWhatsAppConfigService: DeleteWhatsAppConfigService
    ) {}

    @ApiOperation({
        summary: 'Gets the WhatsApp instance of the current clinic (empty list when none or disabled)',
        responses: [{status: 200, description: 'WhatsApp instances', type: [WhatsAppConfigDto]}],
    })
    @Authorize(WhatsAppPermission.VIEW)
    @Get()
    getWhatsAppConfig(@RequestActor() actor: Actor): Promise<WhatsAppConfigDto[]> {
        return this.getWhatsAppConfigService.execute({actor, payload: undefined});
    }

    @ApiOperation({
        summary: 'Creates the WhatsApp instance of the current clinic and returns the pairing QR code',
        responses: [{status: 201, description: 'WhatsApp instance created', type: WhatsAppConfigDto}],
    })
    @Authorize(WhatsAppPermission.CREATE)
    @Post()
    createWhatsAppConfig(
        @RequestActor() actor: Actor,
        @Body() payload: CreateWhatsAppConfigDto
    ): Promise<WhatsAppConfigDto> {
        return this.createWhatsAppConfigService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a fresh QR code to pair the WhatsApp instance of the current clinic',
        responses: [{status: 200, description: 'WhatsApp QR code', type: WhatsAppQrCodeDto}],
    })
    @Authorize(WhatsAppPermission.CONNECT)
    @Get('qrcode')
    getWhatsAppQrcode(@RequestActor() actor: Actor): Promise<WhatsAppQrCodeDto> {
        return this.getWhatsAppQrcodeService.execute({actor, payload: undefined});
    }

    @ApiOperation({
        summary: 'Disconnects the phone paired with the WhatsApp instance of the current clinic',
        responses: [{status: 204, description: 'WhatsApp disconnected'}],
    })
    @Authorize(WhatsAppPermission.LOGOUT)
    @Post('logout')
    @HttpCode(204)
    async logoutWhatsAppConfig(@RequestActor() actor: Actor): Promise<void> {
        await this.logoutWhatsAppConfigService.execute({actor, payload: undefined});
    }

    @ApiOperation({
        summary: 'Deletes the WhatsApp instance of the current clinic',
        responses: [{status: 204, description: 'WhatsApp instance deleted'}],
    })
    @Authorize(WhatsAppPermission.DELETE)
    @Delete()
    @HttpCode(204)
    async deleteWhatsAppConfig(@RequestActor() actor: Actor): Promise<void> {
        await this.deleteWhatsAppConfigService.execute({actor, payload: undefined});
    }
}
