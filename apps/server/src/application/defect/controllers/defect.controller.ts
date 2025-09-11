import {Body, Controller, Delete, Get, Patch, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {DefectPermission} from '../../../domain/auth';
import {DefectId} from '../../../domain/defect/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    CreateDefectDto,
    DefectDto,
    deleteDefectSchema,
    finishDefectSchema,
    getDefectSchema,
    ListDefectDto,
    UpdateDefectInputDto,
    updateDefectSchema,
} from '../dtos';
import {
    CreateDefectService,
    DeleteDefectService,
    FinishDefectService,
    GetDefectService,
    ListDefectService,
    UpdateDefectService,
} from '../services';

@ApiTags('Defect')
@Controller('defect')
export class DefectController {
    constructor(
        private readonly createDefectService: CreateDefectService,
        private readonly listDefectService: ListDefectService,
        private readonly getDefectService: GetDefectService,
        private readonly updateDefectService: UpdateDefectService,
        private readonly deleteDefectService: DeleteDefectService,
        private readonly finishDefectService: FinishDefectService
    ) {}

    @ApiOperation({
        summary: 'Creates a new defect',
        responses: [
            {
                status: 201,
                description: 'Defect created',
                type: DefectDto,
            },
        ],
    })
    @Authorize(DefectPermission.CREATE)
    @Post()
    async createDefect(@RequestActor() actor: Actor, @Body() payload: CreateDefectDto): Promise<DefectDto> {
        return this.createDefectService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a defect',
        parameters: [entityIdParam('Defect ID')],
        responses: [
            {
                status: 200,
                description: 'Defect found',
                type: DefectDto,
            },
        ],
    })
    @Authorize(DefectPermission.VIEW)
    @Get(':id')
    async getDefect(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getDefectSchema.shape.id) id: DefectId
    ): Promise<DefectDto> {
        return this.getDefectService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Lists defects',
        responses: [
            {
                status: 200,
                description: 'Defects found',
                type: DefectDto,
            },
        ],
    })
    @Authorize(DefectPermission.VIEW)
    @Get()
    async listDefect(@RequestActor() actor: Actor, @Query() payload: ListDefectDto): Promise<PaginatedDto<DefectDto>> {
        return this.listDefectService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates a defect',
        parameters: [entityIdParam('Defect ID')],
        responses: [
            {
                status: 200,
                description: 'Defect updated',
                type: DefectDto,
            },
        ],
    })
    @Authorize(DefectPermission.UPDATE)
    @Put(':id')
    async updateDefect(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateDefectSchema.shape.id) id: DefectId,
        @Body() payload: UpdateDefectInputDto
    ): Promise<DefectDto> {
        return this.updateDefectService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a defect',
        parameters: [entityIdParam('Defect ID')],
        responses: [
            {
                status: 200,
                description: 'Defect deleted',
            },
        ],
    })
    @Authorize(DefectPermission.DELETE)
    @Delete(':id')
    async deleteDefect(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteDefectSchema.shape.id) id: DefectId
    ): Promise<void> {
        await this.deleteDefectService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Finish a defect',
        parameters: [entityIdParam('Defect ID')],
        responses: [
            {
                status: 200,
                description: 'Defect finish',
            },
        ],
    })
    @Authorize(DefectPermission.FINISH)
    @Patch('/:id/finish')
    async finishDefect(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', finishDefectSchema.shape.id) id: DefectId
    ): Promise<DefectDto> {
        return this.finishDefectService.execute({actor, payload: {id}});
    }
}
