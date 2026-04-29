import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { Actor } from "@domain/@shared/actor";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicPermission, InsurancePlanPermission } from "@domain/auth";
import { Authorize } from "@application/@shared/auth";
import { BypassClinicMember } from "@application/@shared/auth/bypass-clinic-member.decorator";
import { RequestActor } from "@application/@shared/auth/request-actor.decorator";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import { entityIdParam } from "@application/@shared/openapi/params";
import { ValidatedParam } from "@application/@shared/validation";
import {
  ClinicDto,
  CreateClinicDto,
  CreateInsurancePlanDto,
  InsurancePlanDto,
  UpdateClinicDto,
} from "@application/clinic/dtos";
import {
  CreateClinicService,
  CreateInsurancePlanService,
  GetClinicService,
  ListInsurancePlansService,
  UpdateClinicService,
} from "@application/clinic/services";

@ApiTags("Clinic")
@Controller("clinics")
export class ClinicController {
  constructor(
    private readonly createClinicService: CreateClinicService,
    private readonly getClinicService: GetClinicService,
    private readonly createInsurancePlanService: CreateInsurancePlanService,
    private readonly listInsurancePlansService: ListInsurancePlansService,
    private readonly updateClinicService: UpdateClinicService,
  ) {}

  @ApiOperation({
    summary: "Creates a new clinic",
    responses: [{ status: 201, description: "Clinic created", type: ClinicDto }],
  })
  @BypassClinicMember()
  @Post()
  createClinic(@RequestActor() actor: Actor, @Body() payload: CreateClinicDto): Promise<ClinicDto> {
    return this.createClinicService.execute({ actor, payload });
  }

  @ApiOperation({
    summary: "Get clinic by id",
    parameters: [entityIdParam("Clinic ID", "clinicId")],
    responses: [{ status: 200, description: "Clinic", type: ClinicDto }],
  })
  @Get(":clinicId")
  getClinic(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "clinicId",
      z
        .string()
        .uuid()
        .transform((v) => ClinicId.from(v)),
    )
    clinicId: ClinicId,
  ): Promise<ClinicDto> {
    return this.getClinicService.execute({ actor, payload: { clinicId } });
  }

  @ApiOperation({
    summary: "Update a clinic",
    parameters: [entityIdParam("Clinic ID", "clinicId")],
    responses: [{ status: 200, description: "Clinic updated", type: ClinicDto }],
  })
  @Authorize(ClinicPermission.UPDATE)
  @Patch(":clinicId")
  updateClinic(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "clinicId",
      z
        .string()
        .uuid()
        .transform((v) => ClinicId.from(v)),
    )
    _clinicId: ClinicId,
    @Body() payload: UpdateClinicDto,
  ): Promise<ClinicDto> {
    return this.updateClinicService.execute({ actor, payload });
  }

  @ApiOperation({
    summary: "List insurance plans for a clinic",
    parameters: [entityIdParam("Clinic ID", "clinicId")],
    responses: [{ status: 200, description: "Insurance plans", type: [InsurancePlanDto] }],
  })
  @Authorize(InsurancePlanPermission.VIEW)
  @Get(":clinicId/insurance-plans")
  listInsurancePlans(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "clinicId",
      z
        .string()
        .uuid()
        .transform((v) => ClinicId.from(v)),
    )
    clinicId: ClinicId,
  ): Promise<InsurancePlanDto[]> {
    return this.listInsurancePlansService.execute({ actor, payload: { clinicId } });
  }

  @ApiOperation({
    summary: "Create an insurance plan for a clinic",
    parameters: [entityIdParam("Clinic ID", "clinicId")],
    responses: [{ status: 201, description: "Insurance plan created", type: InsurancePlanDto }],
  })
  @Authorize(InsurancePlanPermission.CREATE)
  @Post(":clinicId/insurance-plans")
  createInsurancePlan(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "clinicId",
      z
        .string()
        .uuid()
        .transform((v) => ClinicId.from(v)),
    )
    clinicId: ClinicId,
    @Body() payload: CreateInsurancePlanDto,
  ): Promise<InsurancePlanDto> {
    return this.createInsurancePlanService.execute({ actor, payload: { ...payload, clinicId } });
  }
}
