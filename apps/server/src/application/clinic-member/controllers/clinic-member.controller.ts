import {Body, Controller, Get, Post, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {BypassClinicMember} from '@application/@shared/auth/bypass-clinic-member.decorator';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {ClinicMemberDto, CreateClinicMemberDto, CreateClinicMemberInputDto} from '@application/clinic-member/dtos';
import {
    CreateClinicMemberService,
    GetCurrentClinicMemberService,
    ListClinicMembersService,
} from '@application/clinic-member/services';
import {Actor} from '@domain/@shared/actor';
import {ClinicMemberPermission} from '@domain/auth';
import {ClinicId} from '@domain/clinic/entities';

@ApiTags('ClinicMember')
@Controller('clinic-members')
export class ClinicMemberController {
    constructor(
        private readonly createClinicMemberService: CreateClinicMemberService,
        private readonly listClinicMembersService: ListClinicMembersService,
        private readonly getCurrentClinicMemberService: GetCurrentClinicMemberService
    ) {}

    @ApiOperation({
        summary: 'Adds a new member to a clinic',
        responses: [{status: 201, description: 'Member created', type: ClinicMemberDto}],
    })
    @BypassClinicMember()
    @Post()
    createClinicMember(@RequestActor() actor: Actor, @Body() payload: CreateClinicMemberDto): Promise<ClinicMemberDto> {
        return this.createClinicMemberService.execute({actor, payload});
    }

    @ApiOperation({
        summary: "Invites a new member into the current actor's clinic",
        responses: [{status: 201, description: 'Member created', type: ClinicMemberDto}],
    })
    @Authorize(ClinicMemberPermission.CREATE)
    @Post('invite')
    inviteClinicMember(
        @RequestActor() actor: Actor,
        @Body() payload: CreateClinicMemberInputDto
    ): Promise<ClinicMemberDto> {
        return this.createClinicMemberService.execute({
            actor,
            payload: {...payload, clinicId: actor.clinicId.toString()},
        });
    }

    @ApiOperation({
        summary: 'Gets the current clinic member (resolved from the authenticated session)',
        responses: [{status: 200, description: 'Current clinic member', type: ClinicMemberDto}],
    })
    @Get('me')
    getCurrentClinicMember(@RequestActor() actor: Actor): Promise<ClinicMemberDto> {
        return this.getCurrentClinicMemberService.execute({actor, payload: undefined});
    }

    @ApiOperation({
        summary: 'List members of a clinic',
        responses: [{status: 200, description: 'Members list', type: ClinicMemberDto, isArray: true}],
    })
    @Get()
    listClinicMembers(@RequestActor() actor: Actor, @Query('clinicId') clinicId: string): Promise<ClinicMemberDto[]> {
        return this.listClinicMembersService.execute({
            actor,
            payload: {clinicId: ClinicId.from(clinicId)},
        });
    }
}
