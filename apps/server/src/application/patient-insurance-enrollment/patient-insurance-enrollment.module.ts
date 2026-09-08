import {Module} from '@nestjs/common';
import {PatientInsuranceEnrollmentController} from '@application/patient-insurance-enrollment/controllers/patient-insurance-enrollment.controller';
import {
    CreatePatientInsuranceEnrollmentService,
    ListPatientInsuranceEnrollmentsService,
    SetPrimaryPatientInsuranceEnrollmentService,
    UpdatePatientInsuranceEnrollmentService,
} from '@application/patient-insurance-enrollment/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [PatientInsuranceEnrollmentController],
    providers: [
        CreatePatientInsuranceEnrollmentService,
        ListPatientInsuranceEnrollmentsService,
        UpdatePatientInsuranceEnrollmentService,
        SetPrimaryPatientInsuranceEnrollmentService,
    ],
})
export class PatientInsuranceEnrollmentModule {}
