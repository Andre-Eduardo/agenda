import { Body, Controller, Delete, Get, Post, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Actor } from "@domain/@shared/actor";
import { ProfessionalId } from "@domain/professional/entities";
import { ProfessionalPermission } from "@domain/auth";
import { Authorize } from "@application/@shared/auth";
import { BypassClinicMember } from "@application/@shared/auth/bypass-clinic-member.decorator";
import { RequestActor } from "@application/@shared/auth/request-actor.decorator";
import { PaginatedDto } from "@application/@shared/dto";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import { entityIdParam } from "@application/@shared/openapi/params";
import { ValidatedParam, ZodValidationPipe } from "@application/@shared/validation";
import {
  CreateProfessionalDto,
  ProfessionalDto,
  SearchProfessionalsDto,
  UpdateProfessionalInputDto,
  getProfessionalSchema,
  searchProfessionalsSchema,
  updateProfessionalSchema,
} from "@application/professional/dtos";
import {
  CreateProfessionalService,
  DeleteProfessionalService,
  GetProfessionalService,
  SearchProfessionalsService,
  UpdateProfessionalService,
} from "@application/professional/services";

@ApiTags("Professional")
@Controller("professionals")
export class ProfessionalController {
  constructor(
    private readonly createProfessionalService: CreateProfessionalService,
    private readonly getProfessionalService: GetProfessionalService,
    private readonly searchProfessionalsService: SearchProfessionalsService,
    private readonly updateProfessionalService: UpdateProfessionalService,
    private readonly deleteProfessionalService: DeleteProfessionalService,
  ) {}

  @ApiOperation({
    summary: "Creates a new professional",
    responses: [{ status: 201, description: "Professional created", type: ProfessionalDto }],
  })
  @BypassClinicMember()
  @Authorize(ProfessionalPermission.CREATE)
  @Post()
  createProfessional(
    @RequestActor() actor: Actor,
    @Body() payload: CreateProfessionalDto,
  ): Promise<ProfessionalDto> {
    return this.createProfessionalService.execute({ actor, payload });
  }

  @ApiOperation({
    summary: "Lists and searches professionals",
    responses: [{ status: 200, description: "Professionals list" }],
  })
  @Authorize(ProfessionalPermission.VIEW)
  @Get()
  searchProfessionals(
    @RequestActor() actor: Actor,
    @Query(new ZodValidationPipe(searchProfessionalsSchema)) query: SearchProfessionalsDto,
  ): Promise<PaginatedDto<ProfessionalDto>> {
    return this.searchProfessionalsService.execute({ actor, payload: query });
  }

  @ApiOperation({
    summary: "Gets a professional by ID",
    parameters: [entityIdParam("Professional ID")],
    responses: [{ status: 200, description: "Professional found", type: ProfessionalDto }],
  })
  @Authorize(ProfessionalPermission.VIEW)
  @Get(":id")
  getProfessional(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", getProfessionalSchema.shape.id) id: ProfessionalId,
  ): Promise<ProfessionalDto> {
    return this.getProfessionalService.execute({ actor, payload: { id } });
  }

  @ApiOperation({
    summary: "Updates a professional",
    parameters: [entityIdParam("Professional ID")],
    responses: [{ status: 200, description: "Professional updated", type: ProfessionalDto }],
  })
  @Authorize(ProfessionalPermission.UPDATE)
  @Put(":id")
  updateProfessional(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", updateProfessionalSchema.shape.id) id: ProfessionalId,
    @Body() payload: UpdateProfessionalInputDto,
  ): Promise<ProfessionalDto> {
    return this.updateProfessionalService.execute({ actor, payload: { id, ...payload } });
  }

  @ApiOperation({
    summary: "Deletes a professional",
    parameters: [entityIdParam("Professional ID")],
    responses: [{ status: 200, description: "Professional deleted" }],
  })
  @Authorize(ProfessionalPermission.DELETE)
  @Delete(":id")
  async deleteProfessional(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", getProfessionalSchema.shape.id) id: ProfessionalId,
  ): Promise<void> {
    await this.deleteProfessionalService.execute({ actor, payload: { id } });
  }
}
