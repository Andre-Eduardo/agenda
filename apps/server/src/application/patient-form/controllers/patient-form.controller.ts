import { Body, Controller, Get, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Actor } from "@domain/@shared/actor";
import { PatientId } from "@domain/patient/entities";
import { PatientFormId } from "@domain/patient-form/entities";
import { PatientFormPermission } from "@domain/auth";
import { Authorize } from "@application/@shared/auth";
import { RequestActor } from "@application/@shared/auth/request-actor.decorator";
import { PaginatedDto } from "@application/@shared/dto";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import { entityIdParam } from "@application/@shared/openapi/params";
import { ValidatedParam, ZodValidationPipe } from "@application/@shared/validation";
import { entityId } from "@application/@shared/validation/schemas";
import {
  PatientFormDto,
  StartPatientFormInputDto,
  SavePatientFormDraftInputDto,
  CompletePatientFormInputDto,
  SearchPatientFormsDto,
  searchPatientFormsSchema,
  patientFormPatientParamSchema,
  patientFormParamSchema,
} from "@application/patient-form/dtos";
import {
  StartPatientFormService,
  SavePatientFormDraftService,
  CompletePatientFormService,
  GetPatientFormService,
  SearchPatientFormsService,
} from "@application/patient-form/services";

@ApiTags("PatientForm")
@Controller("patients/:patientId/forms")
export class PatientFormController {
  constructor(
    private readonly startService: StartPatientFormService,
    private readonly draftService: SavePatientFormDraftService,
    private readonly completeService: CompletePatientFormService,
    private readonly getService: GetPatientFormService,
    private readonly searchService: SearchPatientFormsService,
  ) {}

  @ApiOperation({
    summary: "List all forms for a patient",
    parameters: [entityIdParam("Patient ID", "patientId")],
    responses: [{ status: 200, description: "Paginated list of patient forms" }],
  })
  @Authorize(PatientFormPermission.VIEW)
  @Get()
  searchPatientForms(
    @RequestActor() actor: Actor,
    @ValidatedParam("patientId", patientFormPatientParamSchema.shape.patientId)
    patientId: PatientId,
    @Query(new ZodValidationPipe(searchPatientFormsSchema)) query: SearchPatientFormsDto,
  ): Promise<PaginatedDto<PatientFormDto>> {
    return this.searchService.execute({ actor, payload: { ...query, patientId } });
  }

  @ApiOperation({
    summary: "Start a new patient form (opens with empty answers)",
    parameters: [entityIdParam("Patient ID", "patientId")],
    responses: [{ status: 201, description: "Patient form started", type: PatientFormDto }],
  })
  @Authorize(PatientFormPermission.CREATE)
  @Post()
  start(
    @RequestActor() actor: Actor,
    @ValidatedParam("patientId", patientFormPatientParamSchema.shape.patientId)
    patientId: PatientId,
    @Body() payload: StartPatientFormInputDto,
  ): Promise<PatientFormDto> {
    return this.startService.execute({ actor, payload: { patientId, ...payload } });
  }

  @ApiOperation({
    summary: "Get a specific patient form",
    parameters: [
      entityIdParam("Patient ID", "patientId"),
      entityIdParam("Form ID", "patientFormId"),
    ],
    responses: [{ status: 200, description: "Patient form", type: PatientFormDto }],
  })
  @Authorize(PatientFormPermission.VIEW)
  @Get(":patientFormId")
  getById(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "patientFormId",
      patientFormParamSchema.shape.patientFormId.pipe(entityId(PatientFormId)),
    )
    patientFormId: PatientFormId,
  ): Promise<PatientFormDto> {
    return this.getService.execute({ actor, payload: { patientFormId } });
  }

  @ApiOperation({
    summary: "Save a draft of the form (partial save, no validation of required fields)",
    parameters: [
      entityIdParam("Patient ID", "patientId"),
      entityIdParam("Form ID", "patientFormId"),
    ],
    responses: [{ status: 200, description: "Draft saved", type: PatientFormDto }],
  })
  @Authorize(PatientFormPermission.UPDATE)
  @Patch(":patientFormId/draft")
  saveDraft(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "patientFormId",
      patientFormParamSchema.shape.patientFormId.pipe(entityId(PatientFormId)),
    )
    patientFormId: PatientFormId,
    @Body() payload: SavePatientFormDraftInputDto,
  ): Promise<PatientFormDto> {
    return this.draftService.execute({ actor, payload: { patientFormId, ...payload } });
  }

  @ApiOperation({
    summary: "Complete the form (validates all required fields and computes scores)",
    parameters: [
      entityIdParam("Patient ID", "patientId"),
      entityIdParam("Form ID", "patientFormId"),
    ],
    responses: [{ status: 200, description: "Form completed", type: PatientFormDto }],
  })
  @Authorize(PatientFormPermission.UPDATE)
  @Post(":patientFormId/complete")
  complete(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "patientFormId",
      patientFormParamSchema.shape.patientFormId.pipe(entityId(PatientFormId)),
    )
    patientFormId: PatientFormId,
    @Body() payload: CompletePatientFormInputDto,
  ): Promise<PatientFormDto> {
    return this.completeService.execute({ actor, payload: { patientFormId, ...payload } });
  }
}
