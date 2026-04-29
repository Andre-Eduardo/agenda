import { Body, Controller, Get, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { Actor } from "@domain/@shared/actor";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicReminderConfigPermission } from "@domain/auth";
import { Authorize } from "@application/@shared/auth";
import { RequestActor } from "@application/@shared/auth/request-actor.decorator";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import { entityIdParam } from "@application/@shared/openapi/params";
import { ValidatedParam } from "@application/@shared/validation";
import {
  ClinicReminderConfigDto,
  UpsertReminderConfigDto,
} from "@application/clinic-reminder-config/dtos/clinic-reminder-config.dto";
import { GetReminderConfigService } from "@application/clinic-reminder-config/services/get-reminder-config.service";
import {
  UpsertReminderConfigService,
  UpsertReminderConfigCommand,
} from "@application/clinic-reminder-config/services/upsert-reminder-config.service";

@ApiTags("Clinic Reminder Config")
@Controller("clinics")
export class ClinicReminderConfigController {
  constructor(
    private readonly getReminderConfigService: GetReminderConfigService,
    private readonly upsertReminderConfigService: UpsertReminderConfigService,
  ) {}

  @ApiOperation({
    summary: "Get reminder configuration for a clinic",
    parameters: [entityIdParam("Clinic ID", "clinicId")],
    responses: [{ status: 200, description: "Reminder config", type: ClinicReminderConfigDto }],
  })
  @Authorize(ClinicReminderConfigPermission.VIEW)
  @Get(":clinicId/reminder-config")
  getReminderConfig(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "clinicId",
      z
        .string()
        .uuid()
        .transform((v) => ClinicId.from(v)),
    )
    clinicId: ClinicId,
  ): Promise<ClinicReminderConfigDto> {
    return this.getReminderConfigService.execute({ actor, payload: { clinicId } });
  }

  @ApiOperation({
    summary: "Create or update reminder configuration for a clinic",
    parameters: [entityIdParam("Clinic ID", "clinicId")],
    responses: [
      { status: 200, description: "Reminder config updated", type: ClinicReminderConfigDto },
    ],
  })
  @Authorize(ClinicReminderConfigPermission.MANAGE)
  @Put(":clinicId/reminder-config")
  upsertReminderConfig(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "clinicId",
      z
        .string()
        .uuid()
        .transform((v) => ClinicId.from(v)),
    )
    clinicId: ClinicId,
    @Body() payload: UpsertReminderConfigDto,
  ): Promise<ClinicReminderConfigDto> {
    return this.upsertReminderConfigService.execute({
      actor,
      payload: { ...payload, clinicId } satisfies UpsertReminderConfigCommand,
    });
  }
}
