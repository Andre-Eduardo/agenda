import {Body, Controller, Get, Post, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {ClinicId} from '../../../domain/clinic/entities';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {ClinicMemberDto, CreateClinicMemberDto} from '../dtos';
import {CreateClinicMemberService, ListClinicMembersService} from '../services';

@ApiTags('ClinicMember')
@Controller('clinic-members')
export class ClinicMemberController {
    constructor(
        private readonly createClinicMemberService: CreateClinicMemberService,
        private readonly listClinicMembersService: ListClinicMembersService,
    ) {}

    @ApiOperation({
        summary: 'Adds a new member to a clinic',
        responses: [{status: 201, description: 'Member created', type: ClinicMemberDto}],
    })
    @Post()
    async createClinicMember(
        @RequestActor() actor: Actor,
        @Body() payload: CreateClinicMemberDto,
    ): Promise<ClinicMemberDto> {
        return this.createClinicMemberService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'List members of a clinic',
        responses: [{status: 200, description: 'Members list', type: ClinicMemberDto, isArray: true}],
    })
    @Get()
    async listClinicMembers(
        @RequestActor() actor: Actor,
        @Query('clinicId') clinicId: string,
    ): Promise<ClinicMemberDto[]> {
        return this.listClinicMembersService.execute({
            actor,
            payload: {clinicId: ClinicId.from(clinicId)},
        });
    }
}
