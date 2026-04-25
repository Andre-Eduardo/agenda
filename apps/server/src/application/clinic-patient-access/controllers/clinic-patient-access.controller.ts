import {Body, Controller, Delete, Param, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {PatientId} from '../../../domain/patient/entities';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {ClinicPatientAccessDto, GrantClinicPatientAccessDto} from '../dtos';
import {GrantClinicPatientAccessService, RevokeClinicPatientAccessService} from '../services';

@ApiTags('ClinicPatientAccess')
@Controller('clinic-patient-accesses')
export class ClinicPatientAccessController {
    constructor(
        private readonly grantService: GrantClinicPatientAccessService,
        private readonly revokeService: RevokeClinicPatientAccessService,
    ) {}

    @ApiOperation({
        summary: 'Grant clinic-patient access to a member',
        responses: [{status: 201, description: 'Access granted', type: ClinicPatientAccessDto}],
    })
    @Post()
    async grantAccess(
        @RequestActor() actor: Actor,
        @Body() payload: GrantClinicPatientAccessDto,
    ): Promise<ClinicPatientAccessDto> {
        return this.grantService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Revoke a member\'s access to a patient',
        responses: [{status: 204, description: 'Access revoked'}],
    })
    @Delete(':memberId/:patientId')
    async revokeAccess(
        @RequestActor() actor: Actor,
        @Param('memberId') memberId: string,
        @Param('patientId') patientId: string,
    ): Promise<void> {
        await this.revokeService.execute({
            actor,
            payload: {
                memberId: ClinicMemberId.from(memberId),
                patientId: PatientId.from(patientId),
            },
        });
    }
}
