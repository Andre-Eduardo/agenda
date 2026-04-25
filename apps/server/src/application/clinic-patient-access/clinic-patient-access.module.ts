import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ClinicPatientAccessController} from './controllers/clinic-patient-access.controller';
import {GrantClinicPatientAccessService, RevokeClinicPatientAccessService} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicPatientAccessController],
    providers: [GrantClinicPatientAccessService, RevokeClinicPatientAccessService],
})
export class ClinicPatientAccessModule {}
