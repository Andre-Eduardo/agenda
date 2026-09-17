import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {
    PatientInsuranceEnrollmentDto,
    UpdatePatientInsuranceEnrollmentDto,
} from '@application/patient-insurance-enrollment/dtos';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {PatientInsuranceEnrollmentRepository} from '@domain/patient-insurance-enrollment/patient-insurance-enrollment.repository';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class UpdatePatientInsuranceEnrollmentService implements ApplicationService<
    UpdatePatientInsuranceEnrollmentDto,
    PatientInsuranceEnrollmentDto
> {
    constructor(
        private readonly enrollmentRepository: PatientInsuranceEnrollmentRepository,
        private readonly patientRepository: PatientRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({
        actor,
        payload: {id, ...props},
    }: Command<UpdatePatientInsuranceEnrollmentDto>): Promise<PatientInsuranceEnrollmentDto> {
        const enrollment = await this.enrollmentRepository.findById(id);

        if (enrollment === null) {
            throw new ResourceNotFoundException('patient_insurance_enrollment.not_found', id.toString());
        }

        if (!enrollment.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Enrollment does not belong to the current clinic.');
        }

        enrollment.updateDetails({
            cardNumber: props.cardNumber,
            validFrom: props.validFrom,
            validUntil: props.validUntil,
        });

        await this.enrollmentRepository.save(enrollment);

        if (enrollment.isPrimary) {
            const patient = await this.patientRepository.findById(enrollment.patientId, actor.clinicId);

            if (patient === null) {
                throw new ResourceNotFoundException('patient.not_found', enrollment.patientId.toString());
            }

            patient.change({
                insuranceCardNumber: enrollment.cardNumber,
                insuranceValidUntil: enrollment.validUntil,
            });
            await this.patientRepository.save(patient);
        }

        this.eventDispatcher.dispatch(actor, enrollment);

        return new PatientInsuranceEnrollmentDto(enrollment);
    }
}
