import {Module} from '@nestjs/common';
import {PatientInsuranceEnrollmentController} from '@application/patient-insurance-enrollment/controllers/patient-insurance-enrollment.controller';
import {ExpirePatientInsuranceEnrollmentsJob} from '@application/patient-insurance-enrollment/jobs/expire-patient-insurance-enrollments.job';
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
        ExpirePatientInsuranceEnrollmentsJob,
    ],
})
export class PatientInsuranceEnrollmentModule {}
