import {Module} from '@nestjs/common';
import {ClinicPatientAccessModule} from '@application/clinic-patient-access/clinic-patient-access.module';
import {PatientCommunicationPreferenceController} from '@application/patient-communication-preference/controllers/patient-communication-preference.controller';
import {
    GetPatientCommunicationPreferencesService,
    RecordPatientOptOutService,
    UpdatePatientCommunicationPreferenceService,
} from '@application/patient-communication-preference/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule, ClinicPatientAccessModule],
    controllers: [PatientCommunicationPreferenceController],
    providers: [
        GetPatientCommunicationPreferencesService,
        UpdatePatientCommunicationPreferenceService,
        RecordPatientOptOutService,
    ],
    exports: [RecordPatientOptOutService],
})
export class PatientCommunicationPreferenceModule {}
