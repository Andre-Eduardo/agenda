import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {ServicePermission} from '../../../domain/auth';
import {ServiceId} from '../../../domain/service/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    CreateServiceDto,
    deleteServiceSchema,
    getServiceSchema,
    ListServiceDto,
    ServiceDto,
    UpdateServiceInputDto,
    updateServiceSchema,
} from '../dtos';
import {
    CreateServiceService,
    DeleteServiceService,
    GetServiceService,
    ListServiceService,
    UpdateServiceService,
} from '../service';

@ApiTags('Service')
@Controller('service')
export class ServiceController {
    constructor(
        private readonly createServiceService: CreateServiceService,
        private readonly listServiceService: ListServiceService,
        private readonly getServiceService: GetServiceService,
        private readonly updateServiceService: UpdateServiceService,
        private readonly deleteServiceService: DeleteServiceService
    ) {}

    @ApiOperation({
        summary: 'Creates a new service',
        responses: [
            {
                status: 201,
                description: 'Service created',
                type: ServiceDto,
            },
        ],
    })
    @Authorize(ServicePermission.CREATE)
    @Post()
    async createService(@RequestActor() actor: Actor, @Body() payload: CreateServiceDto): Promise<ServiceDto> {
        return this.createServiceService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a service',
        parameters: [entityIdParam('Service ID')],
        responses: [
            {
                status: 200,
                description: 'Services found',
                type: ServiceDto,
            },
        ],
    })
    @Authorize(ServicePermission.VIEW)
    @Get(':id')
    async getService(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getServiceSchema.shape.id) id: ServiceId
    ): Promise<ServiceDto> {
        return this.getServiceService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Lists services',
        responses: [
            {
                status: 200,
                description: 'Services found',
                type: ServiceDto,
            },
        ],
    })
    @Authorize(ServicePermission.VIEW)
    @Get()
    async listService(
        @RequestActor() actor: Actor,
        @Query() payload: ListServiceDto
    ): Promise<PaginatedDto<ServiceDto>> {
        return this.listServiceService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates a service',
        parameters: [entityIdParam('Service ID')],
        responses: [
            {
                status: 200,
                description: 'Service updated',
                type: ServiceDto,
            },
        ],
    })
    @Authorize(ServicePermission.UPDATE)
    @Put(':id')
    async updateService(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateServiceSchema.shape.id) id: ServiceId,
        @Body() payload: UpdateServiceInputDto
    ): Promise<ServiceDto> {
        return this.updateServiceService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a service',
        parameters: [entityIdParam('Service ID')],
        responses: [
            {
                status: 200,
                description: 'Service deleted',
            },
        ],
    })
    @Authorize(ServicePermission.DELETE)
    @Delete(':id')
    async deleteService(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteServiceSchema.shape.id) id: ServiceId
    ): Promise<void> {
        return this.deleteServiceService.execute({actor, payload: {id}});
    }
}
