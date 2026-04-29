import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Actor } from "@domain/@shared/actor";
import { RecordId } from "@domain/record/entities";
import { RecordPermission } from "@domain/auth";
import { Authorize } from "@application/@shared/auth";
import { RequestActor } from "@application/@shared/auth/request-actor.decorator";
import { PaginatedDto } from "@application/@shared/dto";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import { entityIdParam } from "@application/@shared/openapi/params";
import { ValidatedParam } from "@application/@shared/validation";
import {
  CreateRecordDto,
  RecordAmendmentDto,
  RecordDto,
  ReopenRecordBodyDto,
  SearchRecordsDto,
  UpdateRecordInputDto,
  getRecordSchema,
  reopenRecordSchema,
  signRecordSchema,
  updateRecordSchema,
} from "@application/record/dtos";
import {
  CreateRecordService,
  DeleteRecordService,
  GetRecordAmendmentsService,
  GetRecordService,
  ReopenRecordService,
  SearchRecordsService,
  SignRecordService,
  UpdateRecordService,
} from "@application/record/services";

@ApiTags("Record")
@Controller("records")
export class RecordController {
  constructor(
    private readonly createRecordService: CreateRecordService,
    private readonly getRecordService: GetRecordService,
    private readonly searchRecordsService: SearchRecordsService,
    private readonly updateRecordService: UpdateRecordService,
    private readonly deleteRecordService: DeleteRecordService,
    private readonly signRecordService: SignRecordService,
    private readonly reopenRecordService: ReopenRecordService,
    private readonly getRecordAmendmentsService: GetRecordAmendmentsService,
  ) {}

  @ApiOperation({
    summary: "Creates a new record",
    responses: [{ status: 201, description: "Record created", type: RecordDto }],
  })
  @Authorize(RecordPermission.CREATE)
  @Post()
  createRecord(@RequestActor() actor: Actor, @Body() payload: CreateRecordDto): Promise<RecordDto> {
    return this.createRecordService.execute({ actor, payload });
  }

  @ApiOperation({
    summary: "Lists and searches records",
    responses: [{ status: 200, description: "Records list" }],
  })
  @Authorize(RecordPermission.VIEW)
  @Get()
  searchRecords(
    @RequestActor() actor: Actor,
    @Query() query: SearchRecordsDto,
  ): Promise<PaginatedDto<RecordDto>> {
    return this.searchRecordsService.execute({ actor, payload: query });
  }

  @ApiOperation({
    summary: "Gets a record by ID",
    parameters: [entityIdParam("Record ID")],
    responses: [{ status: 200, description: "Record found", type: RecordDto }],
  })
  @Authorize(RecordPermission.VIEW)
  @Get(":id")
  getRecord(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", getRecordSchema.shape.id) id: RecordId,
  ): Promise<RecordDto> {
    return this.getRecordService.execute({ actor, payload: { id } });
  }

  @ApiOperation({
    summary: "Signs and locks a record",
    parameters: [entityIdParam("Record ID")],
    responses: [{ status: 200, description: "Record signed", type: RecordDto }],
  })
  @Authorize(RecordPermission.UPDATE)
  @HttpCode(HttpStatus.OK)
  @Post(":id/sign")
  signRecord(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", signRecordSchema.shape.id) id: RecordId,
  ): Promise<RecordDto> {
    return this.signRecordService.execute({ actor, payload: { id } });
  }

  @ApiOperation({
    summary: "Reopens a locked record with justification",
    parameters: [entityIdParam("Record ID")],
    responses: [{ status: 200, description: "Record reopened", type: RecordDto }],
  })
  @Authorize(RecordPermission.UPDATE)
  @HttpCode(HttpStatus.OK)
  @Post(":id/reopen")
  reopenRecord(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", reopenRecordSchema.shape.id) id: RecordId,
    @Body() body: ReopenRecordBodyDto,
  ): Promise<RecordDto> {
    return this.reopenRecordService.execute({
      actor,
      payload: { id, justification: body.justification },
    });
  }

  @ApiOperation({
    summary: "Lists amendments (reopen history) for a record",
    parameters: [entityIdParam("Record ID")],
    responses: [{ status: 200, description: "Amendments list", type: [RecordAmendmentDto] }],
  })
  @Authorize(RecordPermission.VIEW)
  @Get(":id/amendments")
  getRecordAmendments(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", getRecordSchema.shape.id) id: RecordId,
  ): Promise<RecordAmendmentDto[]> {
    return this.getRecordAmendmentsService.execute({ actor, payload: { id } });
  }

  @ApiOperation({
    summary: "Updates a record",
    parameters: [entityIdParam("Record ID")],
    responses: [{ status: 200, description: "Record updated", type: RecordDto }],
  })
  @Authorize(RecordPermission.UPDATE)
  @Put(":id")
  updateRecord(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", updateRecordSchema.shape.id) id: RecordId,
    @Body() payload: UpdateRecordInputDto,
  ): Promise<RecordDto> {
    return this.updateRecordService.execute({ actor, payload: { id, ...payload } });
  }

  @ApiOperation({
    summary: "Deletes a record",
    parameters: [entityIdParam("Record ID")],
    responses: [{ status: 200, description: "Record deleted" }],
  })
  @Authorize(RecordPermission.DELETE)
  @Delete(":id")
  async deleteRecord(
    @RequestActor() actor: Actor,
    @ValidatedParam("id", getRecordSchema.shape.id) id: RecordId,
  ): Promise<void> {
    await this.deleteRecordService.execute({ actor, payload: { id } });
  }
}
