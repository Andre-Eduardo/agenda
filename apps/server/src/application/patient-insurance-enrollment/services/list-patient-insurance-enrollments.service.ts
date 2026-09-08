import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {
    ListPatientInsuranceEnrollmentsDto,
    PatientInsuranceEnrollmentDto,
} from '@application/patient-insurance-enrollment/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {PatientInsuranceEnrollmentRepository} from '@domain/patient-insurance-enrollment/patient-insurance-enrollment.repository';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class ListPatientInsuranceEnrollmentsService
    implements ApplicationService<ListPatientInsuranceEnrollmentsDto, PatientInsuranceEnrollmentDto[]>
{
    constructor(
        private readonly enrollmentRepository: PatientInsuranceEnrollmentRepository,
        private readonly patientRepository: PatientRepository
    ) {}

    async execute({
        actor,
        payload,
    }: Command<ListPatientInsuranceEnrollmentsDto>): Promise<PatientInsuranceEnrollmentDto[]> {
        const patient = await this.patientRepository.findById(payload.patientId, actor.clinicId);

        if (patient === null) {
            throw new ResourceNotFoundException('patient.not_found', payload.patientId.toString());
        }

        const enrollments = await this.enrollmentRepository.findByPatientId(payload.patientId);

        return enrollments.map((e) => new PatientInsuranceEnrollmentDto(e));
    }
}
