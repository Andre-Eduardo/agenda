import {Body, Controller, Get, Patch, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam} from '@application/@shared/validation';
import {
    CreatePackagePlanDto,
    PackagePlanDto,
    UpdatePackagePlanInputDto,
    deactivatePackagePlanSchema,
    updatePackagePlanSchema,
} from '@application/package-plan/dtos';
import {
    CreatePackagePlanService,
    DeactivatePackagePlanService,
    ListPackagePlansService,
    UpdatePackagePlanService,
} from '@application/package-plan/services';
import {Actor} from '@domain/@shared/actor';
import {PackagePlanPermission} from '@domain/auth';
import {PackagePlanId} from '@domain/package-plan/entities';

@ApiTags('PackagePlan')
@Controller('package-plans')
export class PackagePlanController {
    constructor(
        private readonly createPackagePlanService: CreatePackagePlanService,
        private readonly listPackagePlansService: ListPackagePlansService,
        private readonly updatePackagePlanService: UpdatePackagePlanService,
        private readonly deactivatePackagePlanService: DeactivatePackagePlanService
    ) {}

    @ApiOperation({
        summary: 'Lists the package catalog for the current clinic',
        responses: [{status: 200, description: 'Package plans', type: [PackagePlanDto]}],
    })
    @Authorize(PackagePlanPermission.VIEW)
    @Get()
    listPackagePlans(@RequestActor() actor: Actor): Promise<PackagePlanDto[]> {
        return this.listPackagePlansService.execute({actor, payload: undefined});
    }

    @ApiOperation({
        summary: 'Creates a package plan in the catalog',
        responses: [{status: 201, description: 'Package plan created', type: PackagePlanDto}],
    })
    @Authorize(PackagePlanPermission.CREATE)
    @Post()
    createPackagePlan(@RequestActor() actor: Actor, @Body() payload: CreatePackagePlanDto): Promise<PackagePlanDto> {
        return this.createPackagePlanService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates a package plan',
        parameters: [entityIdParam('Package plan ID')],
        responses: [{status: 200, description: 'Package plan updated', type: PackagePlanDto}],
    })
    @Authorize(PackagePlanPermission.UPDATE)
    @Patch(':id')
    updatePackagePlan(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updatePackagePlanSchema.shape.id) id: PackagePlanId,
        @Body() payload: UpdatePackagePlanInputDto
    ): Promise<PackagePlanDto> {
        return this.updatePackagePlanService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deactivates a package plan (stops it from being sold)',
        parameters: [entityIdParam('Package plan ID')],
        responses: [{status: 200, description: 'Package plan deactivated', type: PackagePlanDto}],
    })
    @Authorize(PackagePlanPermission.UPDATE)
    @Patch(':id/deactivate')
    deactivatePackagePlan(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deactivatePackagePlanSchema.shape.id) id: PackagePlanId
    ): Promise<PackagePlanDto> {
        return this.deactivatePackagePlanService.execute({actor, payload: {id}});
    }
}
