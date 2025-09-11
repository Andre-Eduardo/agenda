import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {EmployeePositionPermission} from '../../../domain/auth';
import {EmployeePositionId} from '../../../domain/employee-position/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    CreateEmployeePositionDto,
    deleteEmployeePositionSchema,
    EmployeePositionDto,
    getEmployeePositionSchema,
    ListEmployeePositionDto,
    UpdateEmployeePositionInputDto,
    updateEmployeePositionSchema,
} from '../dtos';
import {
    CreateEmployeePositionService,
    DeleteEmployeePositionService,
    GetEmployeePositionService,
    ListEmployeePositionService,
    UpdateEmployeePositionService,
} from '../services';

@ApiTags('Employee position')
@Controller('employee-position')
export class EmployeePositionController {
    constructor(
        private readonly createEmployeePositionService: CreateEmployeePositionService,
        private readonly listEmployeePositionService: ListEmployeePositionService,
        private readonly getEmployeePositionService: GetEmployeePositionService,
        private readonly updateEmployeePositionService: UpdateEmployeePositionService,
        private readonly deleteEmployeePositionService: DeleteEmployeePositionService
    ) {}

    @ApiOperation({
        summary: 'Creates a new employee position',
        responses: [
            {
                status: 201,
                description: 'Employee position created',
                type: EmployeePositionDto,
            },
        ],
    })
    @Authorize(EmployeePositionPermission.CREATE)
    @Post()
    async createEmployeePosition(
        @RequestActor() actor: Actor,
        @Body() payload: CreateEmployeePositionDto
    ): Promise<EmployeePositionDto> {
        return this.createEmployeePositionService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets an employee position',
        parameters: [entityIdParam('Employee position ID')],
        responses: [
            {
                status: 200,
                description: 'Employee position found',
                type: EmployeePositionDto,
            },
        ],
    })
    @Authorize(EmployeePositionPermission.VIEW)
    @Get(':id')
    async getEmployeePosition(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getEmployeePositionSchema.shape.id) id: EmployeePositionId
    ): Promise<EmployeePositionDto> {
        return this.getEmployeePositionService.execute({actor, payload: {id}});
    }

    @ApiPaginatedOperation({
        summary: 'Finds employee positions',
        responses: [
            {
                status: 200,
                description: 'Employee positions found',
                model: EmployeePositionDto,
            },
        ],
    })
    @Authorize(EmployeePositionPermission.VIEW)
    @Get()
    async listEmployeePosition(
        @RequestActor() actor: Actor,
        @Query() payload: ListEmployeePositionDto
    ): Promise<PaginatedDto<EmployeePositionDto>> {
        return this.listEmployeePositionService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates an employee position',
        parameters: [entityIdParam('Employee position ID')],
        responses: [
            {
                status: 200,
                description: 'Employee position updated',
                type: EmployeePositionDto,
            },
        ],
    })
    @Authorize(EmployeePositionPermission.UPDATE)
    @Put(':id')
    async updateEmployeePosition(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateEmployeePositionSchema.shape.id) id: EmployeePositionId,
        @Body() payload: UpdateEmployeePositionInputDto
    ): Promise<EmployeePositionDto> {
        return this.updateEmployeePositionService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes an employee position',
        parameters: [entityIdParam('Employee position ID')],
        responses: [
            {
                status: 200,
                description: 'Employee position deleted',
            },
        ],
    })
    @Authorize(EmployeePositionPermission.DELETE)
    @Delete(':id')
    async deleteEmployeePosition(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteEmployeePositionSchema.shape.id) id: EmployeePositionId
    ): Promise<void> {
        await this.deleteEmployeePositionService.execute({actor, payload: {id}});
    }
}
