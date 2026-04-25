import {Controller, Get} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {ClinicId} from '../../../domain/clinic/entities';
import {AppointmentReminderPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {AppointmentReminderDto} from '../dtos/appointment-reminder.dto';
import {ListPendingRemindersService} from '../services/list-pending-reminders.service';

@ApiTags('Appointment Reminder')
@Controller('clinics')
export class AppointmentReminderController {
    constructor(private readonly listPendingRemindersService: ListPendingRemindersService) {}

    @ApiOperation({
        summary: 'Lists pending reminders due within the next 10 minutes for a clinic',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        responses: [{status: 200, description: 'Pending reminders', type: [AppointmentReminderDto]}],
    })
    @Authorize(AppointmentReminderPermission.VIEW)
    @Get(':clinicId/reminders/pending')
    async listPendingReminders(
        @ValidatedParam('clinicId', z.string().uuid().transform((v) => ClinicId.from(v)))
        clinicId: ClinicId,
    ): Promise<AppointmentReminderDto[]> {
        return this.listPendingRemindersService.listDue(clinicId);
    }
}
