import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiExtraModels, ApiTags, refs} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {CustomerPermission} from '../../../domain/auth';
import {PersonId} from '../../../domain/person/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedBody, ValidatedParam} from '../../@shared/validation';
import {
    CreateCustomerDto,
    getCustomerSchema,
    UpdateCustomerInputDto,
    updateCustomerSchema,
    CustomerDto,
    deleteCustomerSchema,
    ListCustomerDto,
    createCustomerSchema,
    CreateCustomerFromIdDto,
    CreateNewCustomerDto,
} from '../dtos';
import {
    CreateCustomerService,
    DeleteCustomerService,
    GetCustomerService,
    ListCustomerService,
    UpdateCustomerService,
} from '../services';

@ApiTags('Customer')
@Controller('customer')
export class CustomerController {
    constructor(
        private readonly createCustomerService: CreateCustomerService,
        private readonly listCustomerService: ListCustomerService,
        private readonly getCustomerService: GetCustomerService,
        private readonly updateCustomerService: UpdateCustomerService,
        private readonly deleteCustomerService: DeleteCustomerService
    ) {}

    @ApiOperation({
        summary: 'Creates a new customer',
        responses: [
            {
                status: 201,
                description: 'Customer created',
                type: CustomerDto,
            },
        ],
        requestBody: {
            content: {
                'application/json': {
                    schema: {
                        oneOf: refs(CreateNewCustomerDto, CreateCustomerFromIdDto),
                    },
                },
            },
        },
    })
    @ApiExtraModels(CreateNewCustomerDto, CreateCustomerFromIdDto)
    @Authorize(CustomerPermission.CREATE)
    @Post()
    async createCustomer(
        @RequestActor() actor: Actor,
        @ValidatedBody(createCustomerSchema) payload: CreateCustomerDto
    ): Promise<CustomerDto> {
        return this.createCustomerService.execute({actor, payload});
    }

    @ApiPaginatedOperation({
        summary: 'Finds customers',
        responses: [
            {
                status: 200,
                description: 'Customers found',
                model: CustomerDto,
            },
        ],
    })
    @Authorize(CustomerPermission.VIEW)
    @Get()
    async listCustomer(
        @RequestActor() actor: Actor,
        @Query() payload: ListCustomerDto
    ): Promise<PaginatedDto<CustomerDto>> {
        return this.listCustomerService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a customer',
        parameters: [entityIdParam('Customer ID')],
        responses: [
            {
                status: 200,
                description: 'Customer found',
                type: CustomerDto,
            },
        ],
    })
    @Authorize(CustomerPermission.VIEW)
    @Get(':id')
    async getCustomer(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getCustomerSchema.shape.id) id: PersonId
    ): Promise<CustomerDto> {
        return this.getCustomerService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Updates a customer',
        parameters: [entityIdParam('Customer ID')],
        responses: [
            {
                status: 200,
                description: 'Customer updated',
                type: CustomerDto,
            },
        ],
    })
    @Authorize(CustomerPermission.UPDATE)
    @Put(':id')
    async updateCustomer(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateCustomerSchema.shape.id) id: PersonId,
        @Body() payload: UpdateCustomerInputDto
    ): Promise<CustomerDto> {
        return this.updateCustomerService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a customer',
        parameters: [entityIdParam('Customer ID')],
        responses: [
            {
                status: 200,
                description: 'Customer deleted',
            },
        ],
    })
    @Authorize(CustomerPermission.DELETE)
    @Delete(':id')
    async deleteCustomer(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteCustomerSchema.shape.id) id: PersonId
    ): Promise<void> {
        await this.deleteCustomerService.execute({actor, payload: {id}});
    }
}
