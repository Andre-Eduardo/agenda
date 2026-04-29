import { Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ClinicId } from "@domain/clinic/entities";
import { AppointmentReminderPermission } from "@domain/auth";
import { Authorize } from "@application/@shared/auth";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import { entityIdParam } from "@application/@shared/openapi/params";
import { ValidatedParam } from "@application/@shared/validation";
import { AppointmentReminderDto } from "@application/appointment-reminder/dtos/appointment-reminder.dto";
import { DispatchRemindersService } from "@application/appointment-reminder/services/dispatch-reminders.service";
import { ListPendingRemindersService } from "@application/appointment-reminder/services/list-pending-reminders.service";

@ApiTags("Appointment Reminder")
@Controller("clinics")
export class AppointmentReminderController {
  constructor(
    private readonly listPendingRemindersService: ListPendingRemindersService,
    private readonly dispatchRemindersService: DispatchRemindersService,
  ) {}

  @ApiOperation({
    summary: "Lists pending reminders due within the next 10 minutes for a clinic",
    parameters: [entityIdParam("Clinic ID", "clinicId")],
    responses: [{ status: 200, description: "Pending reminders", type: [AppointmentReminderDto] }],
  })
  @Authorize(AppointmentReminderPermission.VIEW)
  @Get(":clinicId/reminders/pending")
  listPendingReminders(
    @ValidatedParam(
      "clinicId",
      z
        .string()
        .uuid()
        .transform((v) => ClinicId.from(v)),
    )
    clinicId: ClinicId,
  ): Promise<AppointmentReminderDto[]> {
    return this.listPendingRemindersService.listDue(clinicId);
  }

  @ApiOperation({
    summary: "Manually triggers reminder dispatch for a clinic (due within next 10 minutes)",
    parameters: [entityIdParam("Clinic ID", "clinicId")],
    responses: [{ status: 204, description: "Dispatch triggered" }],
  })
  @Authorize(AppointmentReminderPermission.DISPATCH)
  @Post(":clinicId/reminders/dispatch")
  @HttpCode(204)
  async dispatchReminders(
    @ValidatedParam(
      "clinicId",
      z
        .string()
        .uuid()
        .transform((v) => ClinicId.from(v)),
    )
    clinicId: ClinicId,
  ): Promise<void> {
    await this.dispatchRemindersService.dispatchDue(clinicId);
  }
}
