import {Module} from '@nestjs/common';
import {ClinicPatientAccessController} from '@application/clinic-patient-access/controllers/clinic-patient-access.controller';
import {
    GrantClinicPatientAccessService,
    RevokeClinicPatientAccessService,
} from '@application/clinic-patient-access/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicPatientAccessController],
    providers: [GrantClinicPatientAccessService, RevokeClinicPatientAccessService],
})
export class ClinicPatientAccessModule {}
