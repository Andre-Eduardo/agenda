import {Module} from '@nestjs/common';
import {PatientAlertController} from '@application/patient-alert/controllers/patient-alert.controller';
import {
    CreatePatientAlertService,
    DeletePatientAlertService,
    GetPatientAlertService,
    SearchPatientAlertsService,
    UpdatePatientAlertService,
} from '@application/patient-alert/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

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
