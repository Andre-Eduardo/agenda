import {Body, Controller, Get, HttpCode, Post, Put} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam} from '@application/@shared/validation';
import {
    ClinicReminderConfigDto,
    PreviewReminderMessageDto,
    ReminderMessagePreviewDto,
    UpsertReminderConfigDto,
} from '@application/clinic-reminder-config/dtos';
import {
    GetReminderConfigService,
    PreviewReminderMessageService,
    UpsertReminderConfigService,
    type PreviewReminderMessageCommand,
    type UpsertReminderConfigCommand,
} from '@application/clinic-reminder-config/services';
import {Actor} from '@domain/@shared/actor';
import {ClinicReminderConfigPermission} from '@domain/auth';
import {ClinicId} from '@domain/clinic/entities';

@ApiTags('Clinic Reminder Config')
@Controller('clinics')
export class ClinicReminderConfigController {
    constructor(
        private readonly getReminderConfigService: GetReminderConfigService,
        private readonly upsertReminderConfigService: UpsertReminderConfigService,
        private readonly previewReminderMessageService: PreviewReminderMessageService
    ) {}

    @ApiOperation({
        summary: "Get the clinic's reminder settings (inactive defaults when never saved)",
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        responses: [{status: 200, description: 'Reminder config', type: ClinicReminderConfigDto}],
    })
    @Authorize(ClinicReminderConfigPermission.VIEW)
    @Get(':clinicId/reminder-config')
    getReminderConfig(
        @RequestActor() actor: Actor,
        @ValidatedParam(
            'clinicId',
            z
                .string()
                .uuid()
                .transform((v) => ClinicId.from(v))
        )
        clinicId: ClinicId
    ): Promise<ClinicReminderConfigDto> {
        return this.getReminderConfigService.execute({actor, payload: {clinicId}});
    }

    @ApiOperation({
        summary: 'Create or update reminder configuration for a clinic',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        responses: [{status: 200, description: 'Reminder config updated', type: ClinicReminderConfigDto}],
    })
    @Authorize(ClinicReminderConfigPermission.MANAGE)
    @Put(':clinicId/reminder-config')
    upsertReminderConfig(
        @RequestActor() actor: Actor,
        @ValidatedParam(
            'clinicId',
            z
                .string()
                .uuid()
                .transform((v) => ClinicId.from(v))
        )
        clinicId: ClinicId,
        @Body() payload: UpsertReminderConfigDto
    ): Promise<ClinicReminderConfigDto> {
        return this.upsertReminderConfigService.execute({
            actor,
            payload: {...payload, clinicId} satisfies UpsertReminderConfigCommand,
        });
    }

    @ApiOperation({
        summary: 'Preview a reminder text filled with sample data (nothing is sent or saved)',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        responses: [{status: 200, description: 'Rendered reminder', type: ReminderMessagePreviewDto}],
    })
    @Authorize(ClinicReminderConfigPermission.VIEW)
    @HttpCode(200)
    @Post(':clinicId/reminder-config/preview')
    previewReminderMessage(
        @RequestActor() actor: Actor,
        @ValidatedParam(
            'clinicId',
            z
                .string()
                .uuid()
                .transform((v) => ClinicId.from(v))
        )
        clinicId: ClinicId,
        @Body() payload: PreviewReminderMessageDto
    ): Promise<ReminderMessagePreviewDto> {
        return this.previewReminderMessageService.execute({
            actor,
            payload: {...payload, clinicId} satisfies PreviewReminderMessageCommand,
        });
    }
}
