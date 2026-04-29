import { Body, Controller, Delete, Get, Patch, Post, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Actor } from "@domain/@shared/actor";
import { AppointmentId } from "@domain/appointment/entities";
import { AppointmentPermission } from "@domain/auth";
import { Authorize } from "@application/@shared/auth";
import { RequestActor } from "@application/@shared/auth/request-actor.decorator";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import { entityIdParam } from "@application/@shared/openapi/params";
import { ValidatedParam, ZodValidationPipe } from "@application/@shared/validation";
import {
  AppointmentDto,
  CancelAppointmentInputDto,
  CreateAppointmentDto,
  SearchAppointmentsDto,
  UpdateAppointmentInputDto,
  callAppointmentSchema,
  cancelAppointmentSchema,
  checkinAppointmentSchema,
  getAppointmentSchema,
  searchAppointmentsSchema,
  updateAppointmentSchema,
} from "@application/appointment/dtos";
import {
  CallAppointmentService,
  CancelAppointmentService,
  CheckinAppointmentService,
  CreateAppointmentService,
  DeleteAppointmentService,
  GetAppointmentService,
  SearchAppointmentsService,
  UpdateAppointmentService,
} from "@application/appointment/services";
import { PaginatedDto } from "@application/@shared/dto";

@ApiTags("Appointment")
@Controller("appointments")
export class AppointmentController {
  constructor(
    private readonly createAppointmentService: CreateAppointmentService,
    private readonly getAppointmentService: GetAppointmentService,
    private readonly searchAppointmentsService: SearchAppointmentsService,
    private readonly updateAppointmentService: UpdateAppointmentService,
    private readonly cancelAppointmentService: CancelAppointmentService,
    private readonly deleteAppointmentService: DeleteAppointmentService,
    private readonly checkinAppointmentService: CheckinAppointmentService,
    private readonly callAppointmentService: CallAppointmentService,
  ) {}

  @ApiOperation({
    summary: "Creates a new appointment",
    responses: [{ status: 201, description: "Appointment created", type: AppointmentDto }],
  })
  @Authorize(AppointmentPermission.CREATE)
  @Post()
  createAppointment(
    @RequestActor() actor: Actor,
    @Body() payload: CreateAppointmentDto,
  ): Promise<AppointmentDto> {
    return this.createAppointmentService.execute({ actor, payload });
  }

  @ApiOperation({
    summary: "Lists and searches appointments",
    responses: [{ status: 200, description: "Appointments list" }],
  })
  @Authorize(AppointmentPermission.VIEW)
  @Get()
  searchAppointments(
    @RequestActor() actor: Actor,
    @Query(new ZodValidationPipe(searchAppointmentsSchema)) query: SearchAppointmentsDto,
  ): Promise<PaginatedDto<AppointmentDto>> {
    return this.searchAppointmentsService.execute({ actor, payload: query });
  }

  @ApiOperation({
    summary: "Gets an appointment by ID",
    parameters: [entityIdParam("Appointment ID")],
    responses: [{ status: 200, description: "Appointment found", type: AppointmentDto }],
  })
  @Authorize(AppointmentPermission.VIEW)
  @Get(":id")
  getAppointment(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", getAppointmentSchema.shape.id) id: AppointmentId,
  ): Promise<AppointmentDto> {
    return this.getAppointmentService.execute({ actor, payload: { id } });
  }

  @ApiOperation({
    summary: "Updates an appointment",
    parameters: [entityIdParam("Appointment ID")],
    responses: [{ status: 200, description: "Appointment updated", type: AppointmentDto }],
  })
  @Authorize(AppointmentPermission.UPDATE)
  @Put(":id")
  updateAppointment(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", updateAppointmentSchema.shape.id) id: AppointmentId,
    @Body() payload: UpdateAppointmentInputDto,
  ): Promise<AppointmentDto> {
    return this.updateAppointmentService.execute({ actor, payload: { id, ...payload } });
  }

  @ApiOperation({
    summary: "Cancels an appointment",
    parameters: [entityIdParam("Appointment ID")],
    responses: [{ status: 200, description: "Appointment cancelled", type: AppointmentDto }],
  })
  @Authorize(AppointmentPermission.CANCEL)
  @Patch(":id/cancel")
  cancelAppointment(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", cancelAppointmentSchema.shape.id) id: AppointmentId,
    @Body() payload: CancelAppointmentInputDto,
  ): Promise<AppointmentDto> {
    return this.cancelAppointmentService.execute({ actor, payload: { id, ...payload } });
  }

  @ApiOperation({
    summary: "Checks in a patient at the reception (SCHEDULED/CONFIRMED → ARRIVED)",
    parameters: [entityIdParam("Appointment ID")],
    responses: [{ status: 200, description: "Patient checked in", type: AppointmentDto }],
  })
  @Authorize(AppointmentPermission.CHECKIN)
  @Patch(":id/checkin")
  checkinAppointment(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", checkinAppointmentSchema.shape.id) id: AppointmentId,
  ): Promise<AppointmentDto> {
    return this.checkinAppointmentService.execute({ actor, payload: { id } });
  }

  @ApiOperation({
    summary: "Calls the patient to the room (ARRIVED → IN_PROGRESS)",
    parameters: [entityIdParam("Appointment ID")],
    responses: [{ status: 200, description: "Patient called", type: AppointmentDto }],
  })
  @Authorize(AppointmentPermission.CALL)
  @Patch(":id/call")
  callAppointment(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", callAppointmentSchema.shape.id) id: AppointmentId,
  ): Promise<AppointmentDto> {
    return this.callAppointmentService.execute({ actor, payload: { id } });
  }

  @ApiOperation({
    summary: "Deletes an appointment",
    parameters: [entityIdParam("Appointment ID")],
    responses: [{ status: 200, description: "Appointment deleted" }],
  })
  @Authorize(AppointmentPermission.DELETE)
  @Delete(":id")
  async deleteAppointment(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", getAppointmentSchema.shape.id) id: AppointmentId,
  ): Promise<void> {
    await this.deleteAppointmentService.execute({ actor, payload: { id } });
  }
}
