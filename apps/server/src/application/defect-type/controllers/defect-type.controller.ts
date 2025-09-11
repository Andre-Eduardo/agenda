import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {DefectTypePermission} from '../../../domain/auth';
import {DefectTypeId} from '../../../domain/defect-type/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    CreateDefectTypeDto,
    DefectTypeDto,
    deleteDefectTypeSchema,
    getDefectTypeSchema,
    ListDefectTypeDto,
    UpdateDefectTypeInputDto,
    updateDefectTypeSchema,
} from '../dtos';
import {
    CreateDefectTypeService,
    DeleteDefectTypeService,
    GetDefectTypeService,
    ListDefectTypeService,
    UpdateDefectTypeService,
} from '../services';

@ApiTags('Defect type')
@Controller('defect-type')
export class DefectTypeController {
    constructor(
        private readonly createDefectTypeService: CreateDefectTypeService,
        private readonly listDefectTypeService: ListDefectTypeService,
        private readonly getDefectTypeService: GetDefectTypeService,
        private readonly updateDefectTypeService: UpdateDefectTypeService,
        private readonly deleteDefectTypeService: DeleteDefectTypeService
    ) {}

    @ApiOperation({
        summary: 'Creates a new defect type',
        responses: [
            {
                status: 201,
                description: 'Defect type created',
                type: DefectTypeDto,
            },
        ],
    })
    @Authorize(DefectTypePermission.CREATE)
    @Post()
    async createDefectType(@RequestActor() actor: Actor, @Body() payload: CreateDefectTypeDto): Promise<DefectTypeDto> {
        return this.createDefectTypeService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a defect type',
        parameters: [entityIdParam('Defect type ID')],
        responses: [
            {
                status: 200,
                description: 'Defect type found',
                type: DefectTypeDto,
            },
        ],
    })
    @Authorize(DefectTypePermission.VIEW)
    @Get(':id')
    async getDefectType(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getDefectTypeSchema.shape.id) id: DefectTypeId
    ): Promise<DefectTypeDto> {
        return this.getDefectTypeService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Lists defect types',
        responses: [
            {
                status: 200,
                description: 'Defect types found',
                type: DefectTypeDto,
            },
        ],
    })
    @Authorize(DefectTypePermission.VIEW)
    @Get()
    async listDefectType(
        @RequestActor() actor: Actor,
        @Query() payload: ListDefectTypeDto
    ): Promise<PaginatedDto<DefectTypeDto>> {
        return this.listDefectTypeService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates a defect type',
        parameters: [entityIdParam('Defect type ID')],
        responses: [
            {
                status: 200,
                description: 'Defect type updated',
                type: DefectTypeDto,
            },
        ],
    })
    @Authorize(DefectTypePermission.UPDATE)
    @Put(':id')
    async updateDefectType(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateDefectTypeSchema.shape.id) id: DefectTypeId,
        @Body() payload: UpdateDefectTypeInputDto
    ): Promise<DefectTypeDto> {
        return this.updateDefectTypeService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a defect type',
        parameters: [entityIdParam('defect type ID')],
        responses: [
            {
                status: 200,
                description: 'Defect type deleted',
            },
        ],
    })
    @Authorize(DefectTypePermission.DELETE)
    @Delete(':id')
    async deleteDefectType(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteDefectTypeSchema.shape.id) id: DefectTypeId
    ): Promise<void> {
        await this.deleteDefectTypeService.execute({actor, payload: {id}});
    }
}
