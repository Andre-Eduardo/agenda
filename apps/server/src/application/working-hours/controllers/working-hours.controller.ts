import {Body, Controller, Delete, Get, HttpCode, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {WorkingHoursId} from '../../../domain/professional/entities';
import {WorkingHoursPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {UpsertWorkingHoursDto, WorkingHoursDto} from '../dtos';
import {DeleteWorkingHoursService, ListWorkingHoursService, UpsertWorkingHoursService} from '../services';
import {entityId} from '../../@shared/validation/schemas';

const memberIdSchema = entityId(ClinicMemberId);
const hoursIdSchema = entityId(WorkingHoursId);

@ApiTags('WorkingHours')
@Controller('members/:memberId/working-hours')
export class WorkingHoursController {
    constructor(
        private readonly upsertService: UpsertWorkingHoursService,
        private readonly listService: ListWorkingHoursService,
        private readonly deleteService: DeleteWorkingHoursService,
    ) {}

    @ApiOperation({
        summary: 'Creates or updates the working hours for a day',
        parameters: [entityIdParam('Member ID', 'memberId')],
        responses: [{status: 200, description: 'Working hours upserted', type: WorkingHoursDto}],
    })
    @Authorize(WorkingHoursPermission.MANAGE)
    @Post()
    @HttpCode(200)
    async upsert(
        @RequestActor() actor: Actor,
        @ValidatedParam('memberId', memberIdSchema) memberId: ClinicMemberId,
        @Body() payload: UpsertWorkingHoursDto,
    ): Promise<WorkingHoursDto> {
        return this.upsertService.execute({actor, payload: {...payload, memberId}});
    }

    @ApiOperation({
        summary: 'Lists all working hours for a member',
        parameters: [entityIdParam('Member ID', 'memberId')],
        responses: [{status: 200, description: 'Working hours list', type: [WorkingHoursDto]}],
    })
    @Authorize(WorkingHoursPermission.MANAGE)
    @Get()
    async list(
        @RequestActor() actor: Actor,
        @ValidatedParam('memberId', memberIdSchema) memberId: ClinicMemberId,
    ): Promise<WorkingHoursDto[]> {
        return this.listService.execute({actor, payload: {memberId}});
    }

    @ApiOperation({
        summary: 'Deletes a working hours entry',
        parameters: [entityIdParam('Member ID', 'memberId'), entityIdParam('Working Hours ID', 'hoursId')],
        responses: [{status: 204, description: 'Working hours deleted'}],
    })
    @Authorize(WorkingHoursPermission.MANAGE)
    @Delete(':hoursId')
    @HttpCode(204)
    async delete(
        @RequestActor() actor: Actor,
        @ValidatedParam('memberId', memberIdSchema) memberId: ClinicMemberId,
        @ValidatedParam('hoursId', hoursIdSchema) hoursId: WorkingHoursId,
    ): Promise<void> {
        await this.deleteService.execute({actor, payload: {memberId, hoursId}});
    }
}
