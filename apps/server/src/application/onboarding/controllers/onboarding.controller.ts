import {Body, Controller, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Public} from '@application/@shared/auth';
import {BypassClinicMember} from '@application/@shared/auth/bypass-clinic-member.decorator';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {RateLimit} from '@application/@shared/rate-limit';
import {OnboardSoloDto, SoloOnboardingDto} from '@application/onboarding/dtos';
import {OnboardSoloService} from '@application/onboarding/services';
import {UnauthenticatedActor} from '@domain/@shared/actor';

@BypassClinicMember()
@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
    constructor(private readonly onboardSoloService: OnboardSoloService) {}

    @ApiOperation({
        summary: 'Self sign-up of an independent professional: user, solo account, member and professional record',
        description: 'Gated by SIGN_UP_SOLO_MODE (falls back to SIGN_UP_MODE; closed by default in production).',
        responses: [{status: 201, description: 'Solo account created', type: SoloOnboardingDto}],
    })
    @Public()
    @RateLimit({name: 'sign-up:ip', limit: 10, windowSeconds: 60 * 60, key: 'ip'})
    @Post('solo')
    onboardSolo(
        @RequestActor() actor: UnauthenticatedActor,
        @Body() payload: OnboardSoloDto
    ): Promise<SoloOnboardingDto> {
        return this.onboardSoloService.execute({actor, payload});
    }
}
