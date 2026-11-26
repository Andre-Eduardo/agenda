import {Body, Controller, Get, Post, Put} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam} from '@application/@shared/validation';
import {CreateProcedureDto, ProcedureDto, UpdateProcedureDto, procedureIdSchema} from '@application/procedure/dtos';
import {ProcedureCatalogService} from '@application/procedure/services';
import {Actor} from '@domain/@shared/actor';
import {AppointmentPermission, ProcedurePermission} from '@domain/auth';
import {ProcedureId} from '@domain/procedure/procedure.entity';

@ApiTags('Procedure')
@Controller('procedures')
export class ProcedureController {
    constructor(private readonly catalog: ProcedureCatalogService) {}

    @Get()
    @Authorize(AppointmentPermission.VIEW)
    @ApiOperation({
        summary: 'List active procedures for scheduling',
        responses: [{status: 200, description: 'Active procedures', type: ProcedureDto, isArray: true}],
    })
    listActiveProcedures(@RequestActor() actor: Actor): Promise<ProcedureDto[]> {
        return this.catalog.list({actor, payload: false});
    }

    @Get('catalog')
    @Authorize(ProcedurePermission.MANAGE)
    @ApiOperation({
        summary: 'List the clinic procedure catalog, including inactive entries',
        responses: [{status: 200, description: 'Procedure catalog', type: ProcedureDto, isArray: true}],
    })
    listProcedureCatalog(@RequestActor() actor: Actor): Promise<ProcedureDto[]> {
        return this.catalog.list({actor, payload: true});
    }

    @Post()
    @Authorize(ProcedurePermission.MANAGE)
    @ApiOperation({
        summary: 'Create a catalog procedure',
        responses: [{status: 201, description: 'Procedure created', type: ProcedureDto}],
    })
    createProcedure(@RequestActor() actor: Actor, @Body() payload: CreateProcedureDto): Promise<ProcedureDto> {
        return this.catalog.create({actor, payload});
    }

    @Put(':id')
    @Authorize(ProcedurePermission.MANAGE)
    @ApiOperation({
        summary: 'Update or deactivate a catalog procedure',
        parameters: [entityIdParam('Procedure ID')],
        responses: [{status: 200, description: 'Procedure updated', type: ProcedureDto}],
    })
    updateProcedure(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', procedureIdSchema) id: ProcedureId,
        @Body() payload: UpdateProcedureDto
    ): Promise<ProcedureDto> {
        return this.catalog.update({actor, payload: {...payload, id}});
    }
}
