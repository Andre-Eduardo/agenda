import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {
    PatientInsuranceEnrollmentDto,
    SetPrimaryPatientInsuranceEnrollmentDto,
} from '@application/patient-insurance-enrollment/dtos';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {PatientInsuranceEnrollmentStatus} from '@domain/patient-insurance-enrollment/entities';
import {PatientInsuranceEnrollmentRepository} from '@domain/patient-insurance-enrollment/patient-insurance-enrollment.repository';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class SetPrimaryPatientInsuranceEnrollmentService implements ApplicationService<
    SetPrimaryPatientInsuranceEnrollmentDto,
    PatientInsuranceEnrollmentDto
> {
    constructor(
        private readonly enrollmentRepository: PatientInsuranceEnrollmentRepository,
        private readonly patientRepository: PatientRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({
        actor,
        payload: {id},
    }: Command<SetPrimaryPatientInsuranceEnrollmentDto>): Promise<PatientInsuranceEnrollmentDto> {
        const enrollment = await this.enrollmentRepository.findById(id);

        if (enrollment === null) {
            throw new ResourceNotFoundException('patient_insurance_enrollment.not_found', id.toString());
        }

        if (!enrollment.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Enrollment does not belong to the current clinic.');
        }

        if (enrollment.status !== PatientInsuranceEnrollmentStatus.ACTIVE) {
            throw new PreconditionException('patient_insurance_enrollment.not_active');
        }

        const others = await this.enrollmentRepository.findOtherActiveByPatientId(enrollment.patientId, id);

        for (const other of others) {
            if (other.isPrimary) {
                other.unmarkAsPrimary();
                await this.enrollmentRepository.save(other);
            }
        }

        enrollment.markAsPrimary();
        await this.enrollmentRepository.save(enrollment);

        const patient = await this.patientRepository.findById(enrollment.patientId, actor.clinicId);

        if (patient === null) {
            throw new ResourceNotFoundException('patient.not_found', enrollment.patientId.toString());
        }

        patient.change({
            insurancePlanId: enrollment.insurancePlanId.toString(),
            insuranceCardNumber: enrollment.cardNumber,
            insuranceValidUntil: enrollment.validUntil,
        });
        await this.patientRepository.save(patient);

        this.eventDispatcher.dispatch(actor, enrollment);

        return new PatientInsuranceEnrollmentDto(enrollment);
    }
}
