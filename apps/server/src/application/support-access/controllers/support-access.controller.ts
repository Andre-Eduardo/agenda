import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Res} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import {z} from 'zod';
import {Authorize} from '@application/@shared/auth';
import {BypassClinicMember} from '@application/@shared/auth/bypass-clinic-member.decorator';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam} from '@application/@shared/validation';
import {ClinicMemberDto} from '@application/clinic-member/dtos';
import {CreateSupportUserDto, SupportUserDto} from '@application/support-access/dtos';
import {
    CreateSupportUserService,
    EnterSupportAccessService,
    LeaveSupportAccessService,
    ListSupportUsersService,
    RevokeSupportUserService,
} from '@application/support-access/services';
import {Actor} from '@domain/@shared/actor';
import {SupportAccessPermission, SupportUserPermission} from '@domain/auth';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {UserId} from '@domain/user/entities';

/**
 * Usuários globais de suporte: entram em qualquer clínica sem ser funcionários dela
 * (só leitura, sem dados clínicos), e o SUPER_ADMIN cria e revoga esses usuários.
 */
@BypassClinicMember()
@ApiTags('Support access')
@Controller()
export class SupportAccessController {
    constructor(
        private readonly enterSupportAccessService: EnterSupportAccessService,
        private readonly leaveSupportAccessService: LeaveSupportAccessService,
        private readonly listSupportUsersService: ListSupportUsersService,
        private readonly createSupportUserService: CreateSupportUserService,
        private readonly revokeSupportUserService: RevokeSupportUserService
    ) {}

    @ApiOperation({
        summary: 'Enters a clinic as a global support user',
        description:
            'Selects the clinic for the session without making the user an employee of it. ' +
            'Every entry is recorded in the clinic audit log.',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        responses: [{status: 200, description: 'Clinic entered', type: ClinicMemberDto}],
    })
    @Authorize(SupportAccessPermission.ENTER)
    @HttpCode(HttpStatus.OK)
    @Post('support-access/clinics/:clinicId')
    async enterClinic(
        @RequestActor() actor: Actor,
        @ValidatedParam(
            'clinicId',
            z
                .string()
                .uuid()
                .transform((value) => ClinicId.from(value))
        )
        clinicId: ClinicId,
        @Res({passthrough: true}) response: Response
    ): Promise<ClinicMemberDto> {
        const member = await this.enterSupportAccessService.execute({actor, payload: {clinicId}});

        response.actions.setClinicMember(ClinicMemberId.from(member.id));

        return member;
    }

    @ApiOperation({
        summary: 'Leaves the clinic the support user entered',
        responses: [{status: 204, description: 'Clinic left'}],
    })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('support-access/leave')
    async leaveClinic(@RequestActor() actor: Actor, @Res({passthrough: true}) response: Response): Promise<void> {
        await this.leaveSupportAccessService.execute({actor, payload: undefined});

        response.actions.setClinicMember(null);
    }

    @ApiOperation({
        summary: 'Lists the global support users',
        responses: [{status: 200, description: 'Support users', type: SupportUserDto, isArray: true}],
    })
    @Authorize(SupportUserPermission.MANAGE)
    @Get('admin/support-users')
    listSupportUsers(@RequestActor() actor: Actor): Promise<SupportUserDto[]> {
        return this.listSupportUsersService.execute({actor, payload: undefined});
    }

    @ApiOperation({
        summary: 'Creates a global support user',
        responses: [{status: 201, description: 'Support user created', type: SupportUserDto}],
    })
    @Authorize(SupportUserPermission.MANAGE)
    @Post('admin/support-users')
    createSupportUser(@RequestActor() actor: Actor, @Body() payload: CreateSupportUserDto): Promise<SupportUserDto> {
        return this.createSupportUserService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Revokes the support role of a user',
        parameters: [entityIdParam('User ID')],
        responses: [{status: 204, description: 'Support role revoked'}],
    })
    @Authorize(SupportUserPermission.MANAGE)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete('admin/support-users/:id')
    revokeSupportUser(
        @RequestActor() actor: Actor,
        @ValidatedParam(
            'id',
            z
                .string()
                .uuid()
                .transform((value) => UserId.from(value))
        )
        id: UserId
    ): Promise<void> {
        return this.revokeSupportUserService.execute({actor, payload: {id}});
    }
}
