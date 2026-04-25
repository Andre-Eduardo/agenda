import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {RecordId} from '../../../domain/record/entities';
import {RecordPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    CreateRecordDto,
    RecordDto,
    SearchRecordsDto,
    UpdateRecordInputDto,
    getRecordSchema,
    updateRecordSchema,
} from '../dtos';
import {
    CreateRecordService,
    DeleteRecordService,
    GetRecordService,
    SearchRecordsService,
    UpdateRecordService,
} from '../services';

@ApiTags('Record')
@Controller('records')
export class RecordController {
    constructor(
        private readonly createRecordService: CreateRecordService,
        private readonly getRecordService: GetRecordService,
        private readonly searchRecordsService: SearchRecordsService,
        private readonly updateRecordService: UpdateRecordService,
        private readonly deleteRecordService: DeleteRecordService
    ) {}

    @ApiOperation({
        summary: 'Creates a new record',
        responses: [{status: 201, description: 'Record created', type: RecordDto}],
    })
    @Authorize(RecordPermission.CREATE)
    @Post()
    async createRecord(@RequestActor() actor: Actor, @Body() payload: CreateRecordDto): Promise<RecordDto> {
        return this.createRecordService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Lists and searches records',
        responses: [{status: 200, description: 'Records list'}],
    })
    @Authorize(RecordPermission.VIEW)
    @Get()
    async searchRecords(
        @RequestActor() actor: Actor,
        @Query() query: SearchRecordsDto
    ): Promise<PaginatedDto<RecordDto>> {
        return this.searchRecordsService.execute({actor, payload: query});
    }

    @ApiOperation({
        summary: 'Gets a record by ID',
        parameters: [entityIdParam('Record ID')],
        responses: [{status: 200, description: 'Record found', type: RecordDto}],
    })
    @Authorize(RecordPermission.VIEW)
    @Get(':id')
    async getRecord(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getRecordSchema.shape.id) id: RecordId
    ): Promise<RecordDto> {
        return this.getRecordService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Updates a record',
        parameters: [entityIdParam('Record ID')],
        responses: [{status: 200, description: 'Record updated', type: RecordDto}],
    })
    @Authorize(RecordPermission.UPDATE)
    @Put(':id')
    async updateRecord(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateRecordSchema.shape.id) id: RecordId,
        @Body() payload: UpdateRecordInputDto
    ): Promise<RecordDto> {
        return this.updateRecordService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a record',
        parameters: [entityIdParam('Record ID')],
        responses: [{status: 200, description: 'Record deleted'}],
    })
    @Authorize(RecordPermission.DELETE)
    @Delete(':id')
    async deleteRecord(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getRecordSchema.shape.id) id: RecordId
    ): Promise<void> {
        await this.deleteRecordService.execute({actor, payload: {id}});
    }
}
