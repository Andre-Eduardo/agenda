import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiExtraModels, ApiTags, refs} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {SupplierPermission} from '../../../domain/auth';
import {PersonId} from '../../../domain/person/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedBody, ValidatedParam} from '../../@shared/validation';
import {
    CreateNewSupplierDto,
    CreateSupplierDto,
    CreateSupplierFromIdDto,
    createSupplierSchema,
    deleteSupplierSchema,
    getSupplierSchema,
    ListSupplierDto,
    SupplierDto,
    UpdateSupplierInputDto,
    updateSupplierSchema,
} from '../dtos';
import {
    CreateSupplierService,
    DeleteSupplierService,
    GetSupplierService,
    ListSupplierService,
    UpdateSupplierService,
} from '../services';

@ApiTags('Supplier')
@Controller('supplier')
export class SupplierController {
    constructor(
        private readonly createSupplierService: CreateSupplierService,
        private readonly listSupplierService: ListSupplierService,
        private readonly getSupplierService: GetSupplierService,
        private readonly updateSupplierService: UpdateSupplierService,
        private readonly deleteSupplierService: DeleteSupplierService
    ) {}

    @ApiOperation({
        summary: 'Creates a new supplier',
        responses: [
            {
                status: 201,
                description: 'Supplier created',
                type: SupplierDto,
            },
        ],
        requestBody: {
            content: {
                'application/json': {
                    schema: {
                        oneOf: refs(CreateNewSupplierDto, CreateSupplierFromIdDto),
                    },
                },
            },
        },
    })
    @ApiExtraModels(CreateNewSupplierDto, CreateSupplierFromIdDto)
    @Authorize(SupplierPermission.CREATE)
    @Post()
    async createSupplier(
        @RequestActor() actor: Actor,
        @ValidatedBody(createSupplierSchema) payload: CreateSupplierDto
    ): Promise<SupplierDto> {
        return this.createSupplierService.execute({actor, payload});
    }

    @ApiPaginatedOperation({
        summary: 'Finds suppliers',
        responses: [
            {
                status: 200,
                description: 'Suppliers found',
                model: SupplierDto,
            },
        ],
    })
    @Authorize(SupplierPermission.VIEW)
    @Get()
    async listSupplier(
        @RequestActor() actor: Actor,
        @Query() payload: ListSupplierDto
    ): Promise<PaginatedDto<SupplierDto>> {
        return this.listSupplierService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a supplier',
        parameters: [entityIdParam('Supplier ID')],
        responses: [
            {
                status: 200,
                description: 'Supplier found',
                type: SupplierDto,
            },
        ],
    })
    @Authorize(SupplierPermission.VIEW)
    @Get(':id')
    async getSupplier(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getSupplierSchema.shape.id) id: PersonId
    ): Promise<SupplierDto> {
        return this.getSupplierService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Updates a supplier',
        parameters: [entityIdParam('Supplier ID')],
        responses: [
            {
                status: 200,
                description: 'Supplier updated',
                type: SupplierDto,
            },
        ],
    })
    @Authorize(SupplierPermission.UPDATE)
    @Put(':id')
    async updateSupplier(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateSupplierSchema.shape.id) id: PersonId,
        @Body() payload: UpdateSupplierInputDto
    ): Promise<SupplierDto> {
        return this.updateSupplierService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a supplier',
        parameters: [entityIdParam('Supplier ID')],
        responses: [
            {
                status: 200,
                description: 'Supplier deleted',
            },
        ],
    })
    @Authorize(SupplierPermission.DELETE)
    @Delete(':id')
    async deleteSupplier(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteSupplierSchema.shape.id) id: PersonId
    ): Promise<void> {
        await this.deleteSupplierService.execute({actor, payload: {id}});
    }
}
