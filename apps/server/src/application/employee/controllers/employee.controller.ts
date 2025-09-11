import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiExtraModels, ApiTags, refs} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {EmployeePermission} from '../../../domain/auth';
import {PersonId} from '../../../domain/person/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedBody, ValidatedParam} from '../../@shared/validation';
import {
    CreateEmployeeDto,
    getEmployeeSchema,
    UpdateEmployeeInputDto,
    updateEmployeeSchema,
    EmployeeDto,
    deleteEmployeeSchema,
    ListEmployeeDto,
    createEmployeeSchema,
    CreateEmployeeFromIdDto,
    CreateNewEmployeeDto,
} from '../dtos';
import {
    CreateEmployeeService,
    DeleteEmployeeService,
    GetEmployeeService,
    ListEmployeeService,
    UpdateEmployeeService,
} from '../services';

@ApiTags('Employee')
@Controller('employee')
export class EmployeeController {
    constructor(
        private readonly createEmployeeService: CreateEmployeeService,
        private readonly listEmployeeService: ListEmployeeService,
        private readonly getEmployeeService: GetEmployeeService,
        private readonly updateEmployeeService: UpdateEmployeeService,
        private readonly deleteEmployeeService: DeleteEmployeeService
    ) {}

    @ApiOperation({
        summary: 'Creates a new employee',
        responses: [
            {
                status: 201,
                description: 'Employee created',
                type: EmployeeDto,
            },
        ],
        requestBody: {
            content: {
                'application/json': {
                    schema: {
                        oneOf: refs(CreateNewEmployeeDto, CreateEmployeeFromIdDto),
                    },
                },
            },
        },
    })
    @ApiExtraModels(CreateNewEmployeeDto, CreateEmployeeFromIdDto)
    @Authorize(EmployeePermission.CREATE)
    @Post()
    async createEmployee(
        @RequestActor() actor: Actor,
        @ValidatedBody(createEmployeeSchema) payload: CreateEmployeeDto
    ): Promise<EmployeeDto> {
        return this.createEmployeeService.execute({actor, payload});
    }

    @ApiPaginatedOperation({
        summary: 'Finds employees',
        responses: [
            {
                status: 200,
                description: 'Employees found',
                model: EmployeeDto,
            },
        ],
    })
    @Authorize(EmployeePermission.VIEW)
    @Get()
    async listEmployee(
        @RequestActor() actor: Actor,
        @Query() payload: ListEmployeeDto
    ): Promise<PaginatedDto<EmployeeDto>> {
        return this.listEmployeeService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets an employee',
        parameters: [entityIdParam('Employee ID')],
        responses: [
            {
                status: 200,
                description: 'Employee found',
                type: EmployeeDto,
            },
        ],
    })
    @Authorize(EmployeePermission.VIEW)
    @Get(':id')
    async getEmployee(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getEmployeeSchema.shape.id) id: PersonId
    ): Promise<EmployeeDto> {
        return this.getEmployeeService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Updates an employee',
        parameters: [entityIdParam('Employee ID')],
        responses: [
            {
                status: 200,
                description: 'Employee updated',
                type: EmployeeDto,
            },
        ],
    })
    @Authorize(EmployeePermission.UPDATE)
    @Put(':id')
    async updateEmployee(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateEmployeeSchema.shape.id) id: PersonId,
        @Body() payload: UpdateEmployeeInputDto
    ): Promise<EmployeeDto> {
        return this.updateEmployeeService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes an employee',
        parameters: [entityIdParam('Employee ID')],
        responses: [
            {
                status: 200,
                description: 'Employee deleted',
            },
        ],
    })
    @Authorize(EmployeePermission.DELETE)
    @Delete(':id')
    async deleteEmployee(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteEmployeeSchema.shape.id) id: PersonId
    ): Promise<void> {
        await this.deleteEmployeeService.execute({actor, payload: {id}});
    }
}
