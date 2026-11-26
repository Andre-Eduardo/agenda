import {Body, Controller, HttpCode, Post, Res, HttpStatus} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import {Public} from '@application/@shared/auth';
import {BypassClinicMember} from '@application/@shared/auth/bypass-clinic-member.decorator';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {RateLimit} from '@application/@shared/rate-limit';
import {RequestPasswordResetDto, ResetPasswordDto, SignInDto} from '@application/auth/dtos';
import {
    RequestPasswordResetService,
    ResetPasswordService,
    SignInService,
    SignOutService,
} from '@application/auth/services';
import {Actor, UnauthenticatedActor} from '@domain/@shared/actor';

@BypassClinicMember()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly signInService: SignInService,
        private readonly signOutService: SignOutService,
        private readonly requestPasswordResetService: RequestPasswordResetService,
        private readonly resetPasswordService: ResetPasswordService
    ) {}

    @ApiOperation({
        summary: 'Signs in to a user',
        responses: [
            {
                status: 200,
                description: 'User signed in',
                headers: {
                    'Set-Cookie': {
                        description: 'The authentication token',
                        schema: {type: 'string'},
                    },
                },
            },
        ],
    })
    @Public()
    // Per IP against password spraying, per username against attacks on one account from many IPs.
    @RateLimit(
        {name: 'sign-in:ip', limit: 20, windowSeconds: 60, key: 'ip'},
        {name: 'sign-in:username', limit: 10, windowSeconds: 15 * 60, key: {bodyField: 'username'}}
    )
    @HttpCode(HttpStatus.OK)
    @Post('/sign-in')
    async signIn(
        @RequestActor() actor: UnauthenticatedActor,
        @Body() payload: SignInDto,
        @Res({passthrough: true}) response: Response
    ): Promise<void> {
        const {token, clinicMemberId} = await this.signInService.execute({actor, payload});

        response.actions.setToken(token);

        if (clinicMemberId !== undefined) {
            response.actions.setClinicMember(clinicMemberId);
        }
    }

    @ApiOperation({
        summary: 'Signs out a user',
        responses: [
            {
                status: 200,
                description: 'User signed out',
                headers: {
                    'Set-Cookie': {
                        description: 'Expires the authentication token',
                        schema: {type: 'string'},
                    },
                },
            },
        ],
    })
    @HttpCode(HttpStatus.OK)
    @Post('/sign-out')
    async signOut(@RequestActor() actor: Actor, @Res({passthrough: true}) response: Response): Promise<void> {
        await this.signOutService.execute({actor, payload: undefined});

        response.actions.setToken(null);
    }

    @ApiOperation({
        summary: 'Sends a password reset link to the e-mail, if it belongs to an account',
        responses: [
            {
                status: 204,
                description: 'Request accepted. The answer is the same whether or not the e-mail is registered.',
            },
        ],
    })
    @Public()
    @RateLimit(
        {name: 'password-reset:ip', limit: 10, windowSeconds: 15 * 60, key: 'ip'},
        {name: 'password-reset:email', limit: 3, windowSeconds: 15 * 60, key: {bodyField: 'email'}}
    )
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('/password-reset/request')
    async requestPasswordReset(
        @RequestActor() actor: UnauthenticatedActor,
        @Body() payload: RequestPasswordResetDto
    ): Promise<void> {
        await this.requestPasswordResetService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Sets a new password using the link sent by e-mail',
        responses: [{status: 204, description: 'Password changed'}],
    })
    @Public()
    @RateLimit({name: 'password-reset-confirm:ip', limit: 10, windowSeconds: 15 * 60, key: 'ip'})
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('/password-reset/confirm')
    async resetPassword(@RequestActor() actor: UnauthenticatedActor, @Body() payload: ResetPasswordDto): Promise<void> {
        await this.resetPasswordService.execute({actor, payload});
    }
}
