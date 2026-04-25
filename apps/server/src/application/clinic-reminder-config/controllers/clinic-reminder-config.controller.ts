import {Body, Controller, Get, Put} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Actor} from '../../../domain/@shared/actor';
import {ClinicId} from '../../../domain/clinic/entities';
import {ClinicReminderConfigPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {ClinicReminderConfigDto, UpsertReminderConfigDto} from '../dtos/clinic-reminder-config.dto';
import {GetReminderConfigService} from '../services/get-reminder-config.service';
import {UpsertReminderConfigService} from '../services/upsert-reminder-config.service';

@ApiTags('Clinic Reminder Config')
@Controller('clinics')
export class ClinicReminderConfigController {
    constructor(
        private readonly getReminderConfigService: GetReminderConfigService,
        private readonly upsertReminderConfigService: UpsertReminderConfigService,
    ) {}

    @ApiOperation({
        summary: 'Get reminder configuration for a clinic',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        responses: [{status: 200, description: 'Reminder config', type: ClinicReminderConfigDto}],
    })
    @Authorize(ClinicReminderConfigPermission.VIEW)
    @Get(':clinicId/reminder-config')
    async getReminderConfig(
        @RequestActor() actor: Actor,
        @ValidatedParam('clinicId', z.string().uuid().transform((v) => ClinicId.from(v)))
        clinicId: ClinicId,
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
    async upsertReminderConfig(
        @RequestActor() actor: Actor,
        @ValidatedParam('clinicId', z.string().uuid().transform((v) => ClinicId.from(v)))
        clinicId: ClinicId,
        @Body() payload: UpsertReminderConfigDto,
    ): Promise<ClinicReminderConfigDto> {
        return this.upsertReminderConfigService.execute({actor, payload: {...payload, clinicId}});
    }
}
