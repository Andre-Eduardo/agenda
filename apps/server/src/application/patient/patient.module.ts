import {Module} from '@nestjs/common';
import {ClinicPatientAccessModule} from '@application/clinic-patient-access/clinic-patient-access.module';
import {PatientController} from '@application/patient/controllers/patient.controller';
import {
    CreatePatientService,
    DeletePatientService,
    GetPatientService,
    SearchPatientsService,
    UpdatePatientService,
} from '@application/patient/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule, ClinicPatientAccessModule],
    controllers: [PatientController],
    providers: [
        CreatePatientService,
        GetPatientService,
        SearchPatientsService,
        UpdatePatientService,
        DeletePatientService,
    ],
})
export class PatientModule {}
