import {Body, Controller, Delete, Get, HttpCode, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam} from '@application/@shared/validation';
import {entityId} from '@application/@shared/validation/schemas';
import {
    GrantProfessionalAgendaAccessDto,
    ProfessionalAgendaAccessDto,
} from '@application/professional-agenda-access/dtos';
import {
    GrantProfessionalAgendaAccessService,
    ListProfessionalAgendaAccessService,
    RevokeProfessionalAgendaAccessService,
} from '@application/professional-agenda-access/services';
import {Actor} from '@domain/@shared/actor';
import {ProfessionalAgendaAccessPermission} from '@domain/auth';
import {ClinicMemberId} from '@domain/clinic-member/entities';

const memberIdSchema = entityId(ClinicMemberId);

@ApiTags('ProfessionalAgendaAccess')
@Controller('members/:memberId/agenda-access')
export class ProfessionalAgendaAccessController {
    constructor(
        private readonly grantService: GrantProfessionalAgendaAccessService,
        private readonly listService: ListProfessionalAgendaAccessService,
        private readonly revokeService: RevokeProfessionalAgendaAccessService
    ) {}

    @ApiOperation({
        summary: "Grants a member access to manage a professional's agenda",
        parameters: [entityIdParam('Professional member ID', 'memberId')],
        responses: [{status: 201, description: 'Access granted', type: ProfessionalAgendaAccessDto}],
    })
    @Authorize(ProfessionalAgendaAccessPermission.GRANT)
    @Post()
    grantProfessionalAgendaAccess(
        @RequestActor() actor: Actor,
        @ValidatedParam('memberId', memberIdSchema) professionalMemberId: ClinicMemberId,
        @Body() payload: GrantProfessionalAgendaAccessDto
    ): Promise<ProfessionalAgendaAccessDto> {
        return this.grantService.execute({actor, payload: {...payload, professionalMemberId}});
    }

    @ApiOperation({
        summary: "Lists members with access to manage this professional's agenda",
        parameters: [entityIdParam('Professional member ID', 'memberId')],
        responses: [{status: 200, description: 'List of grants', type: [ProfessionalAgendaAccessDto]}],
    })
    @Authorize(ProfessionalAgendaAccessPermission.LIST)
    @Get()
    listProfessionalAgendaAccess(
        @RequestActor() actor: Actor,
        @ValidatedParam('memberId', memberIdSchema) professionalMemberId: ClinicMemberId
    ): Promise<ProfessionalAgendaAccessDto[]> {
        return this.listService.execute({actor, payload: {professionalMemberId}});
    }

    @ApiOperation({
        summary: "Revokes a member's access to manage this professional's agenda",
        parameters: [
            entityIdParam('Professional member ID', 'memberId'),
            entityIdParam('Grantee member ID', 'granteeMemberId'),
        ],
        responses: [{status: 204, description: 'Access revoked'}],
    })
    @Authorize(ProfessionalAgendaAccessPermission.REVOKE)
    @Delete(':granteeMemberId')
    @HttpCode(204)
    async revokeProfessionalAgendaAccess(
        @RequestActor() actor: Actor,
        @ValidatedParam('memberId', memberIdSchema) professionalMemberId: ClinicMemberId,
        @ValidatedParam('granteeMemberId', memberIdSchema) granteeMemberId: ClinicMemberId
    ): Promise<void> {
        await this.revokeService.execute({actor, payload: {professionalMemberId, granteeMemberId}});
    }
}
