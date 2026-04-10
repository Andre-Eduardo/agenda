import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {PatientAlertController} from './controllers/patient-alert.controller';
import {
    CreatePatientAlertService,
    DeletePatientAlertService,
    GetPatientAlertService,
    SearchPatientAlertsService,
    UpdatePatientAlertService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [PatientAlertController],
    providers: [
        CreatePatientAlertService,
        GetPatientAlertService,
        SearchPatientAlertsService,
        UpdatePatientAlertService,
        DeletePatientAlertService,
    ],
})
export class PatientAlertModule {}
