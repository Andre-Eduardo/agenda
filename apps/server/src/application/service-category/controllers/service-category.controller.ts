import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {ServiceCategoryPermission} from '../../../domain/auth';
import {ServiceCategoryId} from '../../../domain/service-category/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    CreateServiceCategoryDto,
    deleteServiceCategorySchema,
    getServiceCategorySchema,
    ListServiceCategoryDto,
    ServiceCategoryDto,
    UpdateServiceCategoryInputDto,
    updateServiceCategorySchema,
} from '../dtos';
import {
    CreateServiceCategoryService,
    DeleteServiceCategoryService,
    GetServiceCategoryService,
    ListServiceCategoryService,
    UpdateServiceCategoryService,
} from '../services';

@ApiTags('Service category')
@Controller('service-category')
export class ServiceCategoryController {
    constructor(
        private readonly createServiceCategoryService: CreateServiceCategoryService,
        private readonly listServiceCategoryService: ListServiceCategoryService,
        private readonly getServiceCategoryService: GetServiceCategoryService,
        private readonly updateServiceCategoryService: UpdateServiceCategoryService,
        private readonly deleteServiceCategoryService: DeleteServiceCategoryService
    ) {}

    @ApiOperation({
        summary: 'Creates a new service category',
        responses: [
            {
                status: 201,
                description: 'Service category created',
                type: ServiceCategoryDto,
            },
        ],
    })
    @Authorize(ServiceCategoryPermission.CREATE)
    @Post()
    async createServiceCategory(
        @RequestActor() actor: Actor,
        @Body() payload: CreateServiceCategoryDto
    ): Promise<ServiceCategoryDto> {
        return this.createServiceCategoryService.execute({actor, payload});
    }

    @ApiPaginatedOperation({
        summary: 'Finds a service categories',
        responses: [
            {
                status: 200,
                description: 'Service categories found',
                model: ServiceCategoryDto,
            },
        ],
    })
    @Authorize(ServiceCategoryPermission.VIEW)
    @Get()
    async listServiceCategory(
        @RequestActor() actor: Actor,
        @Query() payload: ListServiceCategoryDto
    ): Promise<PaginatedDto<ServiceCategoryDto>> {
        return this.listServiceCategoryService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a service category',
        parameters: [entityIdParam('Service category ID')],
        responses: [
            {
                status: 200,
                description: 'Service category found',
                type: ServiceCategoryDto,
            },
        ],
    })
    @Authorize(ServiceCategoryPermission.VIEW)
    @Get(':id')
    async getServiceCategory(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getServiceCategorySchema.shape.id) id: ServiceCategoryId
    ): Promise<ServiceCategoryDto> {
        return this.getServiceCategoryService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Updates a service category',
        parameters: [entityIdParam('Service category ID')],
        responses: [
            {
                status: 200,
                description: 'Service category updated',
            },
        ],
    })
    @Authorize(ServiceCategoryPermission.UPDATE)
    @Put(':id')
    async updateServiceCategory(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateServiceCategorySchema.shape.id) id: ServiceCategoryId,
        @Body() payload: UpdateServiceCategoryInputDto
    ): Promise<ServiceCategoryDto> {
        return this.updateServiceCategoryService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a service category',
        parameters: [entityIdParam('Service category ID')],
        responses: [
            {
                status: 200,
                description: 'Service category deleted',
            },
        ],
    })
    @Authorize(ServiceCategoryPermission.DELETE)
    @Delete(':id')
    async deleteServiceCategory(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteServiceCategorySchema.shape.id) id: ServiceCategoryId
    ): Promise<void> {
        await this.deleteServiceCategoryService.execute({actor, payload: {id}});
    }
}
