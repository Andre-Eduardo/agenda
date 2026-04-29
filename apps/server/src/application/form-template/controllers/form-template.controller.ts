import { Body, Controller, Delete, Get, HttpCode, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Actor } from "@domain/@shared/actor";
import { FormTemplateId } from "@domain/form-template/entities";
import { FormTemplateVersionId } from "@domain/form-template-version/entities";
import { FormTemplatePermission } from "@domain/auth";
import { Authorize } from "@application/@shared/auth";
import { RequestActor } from "@application/@shared/auth/request-actor.decorator";
import { PaginatedDto } from "@application/@shared/dto";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import { entityIdParam } from "@application/@shared/openapi/params";
import { ValidatedParam, ZodValidationPipe } from "@application/@shared/validation";
import { entityId } from "@application/@shared/validation/schemas";
import {
  FormTemplateDto,
  FormTemplateVersionDto,
  CreateFormTemplateInputDto,
  SearchFormTemplatesDto,
  searchFormTemplatesSchema,
  formTemplateParamSchema,
  formTemplateVersionParamSchema,
  CreateFormTemplateVersionInputDto,
} from "@application/form-template/dtos";
import {
  CreateFormTemplateService,
  GetFormTemplateService,
  SearchFormTemplatesService,
  CloneFormTemplateService,
  DeleteFormTemplateService,
  CreateFormTemplateVersionService,
  PublishFormTemplateVersionService,
  DeprecateFormTemplateVersionService,
  ListFormTemplateVersionsService,
} from "@application/form-template/services";
import { z } from "zod";

const cloneBodySchema = z.object({
  code: z.string().min(3).max(100),
  name: z.string().min(1).max(255).optional(),
});

@ApiTags("FormTemplate")
@Controller("form-templates")
export class FormTemplateController {
  constructor(
    private readonly createService: CreateFormTemplateService,
    private readonly getService: GetFormTemplateService,
    private readonly searchService: SearchFormTemplatesService,
    private readonly cloneService: CloneFormTemplateService,
    private readonly deleteService: DeleteFormTemplateService,
    private readonly createVersionService: CreateFormTemplateVersionService,
    private readonly listVersionsService: ListFormTemplateVersionsService,
    private readonly publishVersionService: PublishFormTemplateVersionService,
    private readonly deprecateVersionService: DeprecateFormTemplateVersionService,
  ) {}

  @ApiOperation({
    summary: "List form templates (filterable by specialty and scope)",
    responses: [{ status: 200, description: "Paginated list of templates" }],
  })
  @Authorize(FormTemplatePermission.VIEW)
  @Get()
  searchFormTemplates(
    @RequestActor() actor: Actor,
    @Query(new ZodValidationPipe(searchFormTemplatesSchema)) query: SearchFormTemplatesDto,
  ): Promise<PaginatedDto<FormTemplateDto>> {
    return this.searchService.execute({ actor, payload: query });
  }

  @ApiOperation({
    summary: "Create a new form template",
    responses: [{ status: 201, description: "Template created", type: FormTemplateDto }],
  })
  @Authorize(FormTemplatePermission.CREATE)
  @Post()
  create(
    @RequestActor() actor: Actor,
    @Body() payload: CreateFormTemplateInputDto,
  ): Promise<FormTemplateDto> {
    return this.createService.execute({ actor, payload });
  }

  @ApiOperation({
    summary: "Get a form template by ID",
    parameters: [entityIdParam("Template ID", "templateId")],
    responses: [{ status: 200, description: "Template", type: FormTemplateDto }],
  })
  @Authorize(FormTemplatePermission.VIEW)
  @Get(":templateId")
  getById(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "templateId",
      formTemplateParamSchema.shape.templateId.pipe(entityId(FormTemplateId)),
    )
    templateId: FormTemplateId,
  ): Promise<FormTemplateDto> {
    return this.getService.execute({ actor, payload: { templateId } });
  }

  @ApiOperation({
    summary: "Clone a public template for a professional",
    parameters: [entityIdParam("Template ID", "templateId")],
    responses: [{ status: 201, description: "Cloned template", type: FormTemplateDto }],
  })
  @Authorize(FormTemplatePermission.CREATE)
  @Post(":templateId/clone")
  clone(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "templateId",
      formTemplateParamSchema.shape.templateId.pipe(entityId(FormTemplateId)),
    )
    templateId: FormTemplateId,
    @Body(new ZodValidationPipe(cloneBodySchema)) body: z.infer<typeof cloneBodySchema>,
  ): Promise<FormTemplateDto> {
    return this.cloneService.execute({
      actor,
      payload: { templateId, ...body },
    });
  }

  @ApiOperation({
    summary: "Soft-delete a form template",
    parameters: [entityIdParam("Template ID", "templateId")],
    responses: [{ status: 204, description: "Deleted" }],
  })
  @Authorize(FormTemplatePermission.DELETE)
  @Delete(":templateId")
  @HttpCode(204)
  async delete(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "templateId",
      formTemplateParamSchema.shape.templateId.pipe(entityId(FormTemplateId)),
    )
    templateId: FormTemplateId,
  ): Promise<void> {
    await this.deleteService.execute({ actor, payload: { templateId } });
  }

  @ApiOperation({
    summary: "List all versions of a template",
    parameters: [entityIdParam("Template ID", "templateId")],
    responses: [{ status: 200, description: "List of versions" }],
  })
  @Authorize(FormTemplatePermission.VIEW)
  @Get(":templateId/versions")
  listVersions(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "templateId",
      formTemplateParamSchema.shape.templateId.pipe(entityId(FormTemplateId)),
    )
    templateId: FormTemplateId,
  ): Promise<FormTemplateVersionDto[]> {
    return this.listVersionsService.execute({ actor, payload: { templateId } });
  }

  @ApiOperation({
    summary: "Create a new version for a template",
    parameters: [entityIdParam("Template ID", "templateId")],
    responses: [{ status: 201, description: "Version created", type: FormTemplateVersionDto }],
  })
  @Authorize(FormTemplatePermission.CREATE)
  @Post(":templateId/versions")
  createVersion(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "templateId",
      formTemplateParamSchema.shape.templateId.pipe(entityId(FormTemplateId)),
    )
    templateId: FormTemplateId,
    @Body() payload: CreateFormTemplateVersionInputDto,
  ): Promise<FormTemplateVersionDto> {
    return this.createVersionService.execute({ actor, payload: { templateId, ...payload } });
  }

  @ApiOperation({
    summary: "Publish a template version",
    parameters: [entityIdParam("Version ID", "versionId")],
    responses: [{ status: 200, description: "Version published", type: FormTemplateVersionDto }],
  })
  @Authorize(FormTemplatePermission.PUBLISH)
  @Post("versions/:versionId/publish")
  publishVersion(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "versionId",
      formTemplateVersionParamSchema.shape.versionId.pipe(entityId(FormTemplateVersionId)),
    )
    versionId: FormTemplateVersionId,
  ): Promise<FormTemplateVersionDto> {
    return this.publishVersionService.execute({ actor, payload: { versionId } });
  }

  @ApiOperation({
    summary: "Deprecate a template version",
    parameters: [entityIdParam("Version ID", "versionId")],
    responses: [{ status: 200, description: "Version deprecated", type: FormTemplateVersionDto }],
  })
  @Authorize(FormTemplatePermission.PUBLISH)
  @Post("versions/:versionId/deprecate")
  deprecateVersion(
    @RequestActor() actor: Actor,
    @ValidatedParam(
      "versionId",
      formTemplateVersionParamSchema.shape.versionId.pipe(entityId(FormTemplateVersionId)),
    )
    versionId: FormTemplateVersionId,
  ): Promise<FormTemplateVersionDto> {
    return this.deprecateVersionService.execute({ actor, payload: { versionId } });
  }
}
