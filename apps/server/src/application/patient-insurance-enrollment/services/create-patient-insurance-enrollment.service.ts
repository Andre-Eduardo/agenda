import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {
    CreatePatientInsuranceEnrollmentDto,
    PatientInsuranceEnrollmentDto,
} from '@application/patient-insurance-enrollment/dtos';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {InsurancePlanRepository} from '@domain/insurance-plan/insurance-plan.repository';
import {
    PatientInsuranceEnrollment,
    PatientInsuranceEnrollmentStatus,
} from '@domain/patient-insurance-enrollment/entities';
import {PatientInsuranceEnrollmentRepository} from '@domain/patient-insurance-enrollment/patient-insurance-enrollment.repository';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class CreatePatientInsuranceEnrollmentService
    implements ApplicationService<CreatePatientInsuranceEnrollmentDto, PatientInsuranceEnrollmentDto>
{
    constructor(
        private readonly enrollmentRepository: PatientInsuranceEnrollmentRepository,
        private readonly patientRepository: PatientRepository,
        private readonly insurancePlanRepository: InsurancePlanRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({
        actor,
        payload,
    }: Command<CreatePatientInsuranceEnrollmentDto>): Promise<PatientInsuranceEnrollmentDto> {
        const patient = await this.patientRepository.findById(payload.patientId, actor.clinicId);

        if (patient === null) {
            throw new ResourceNotFoundException('patient.not_found', payload.patientId.toString());
        }

        const plan = await this.insurancePlanRepository.findById(payload.insurancePlanId);

        if (plan === null || !plan.clinicId.equals(actor.clinicId)) {
            throw new ResourceNotFoundException('insurance_plan.not_found', payload.insurancePlanId.toString());
        }

        const existing = await this.enrollmentRepository.findByPatientAndPlan(
            payload.patientId,
            payload.insurancePlanId
        );

        if (existing !== null) {
            throw new PreconditionException('patient_insurance_enrollment.already_linked');
        }

        const patientEnrollments = await this.enrollmentRepository.findByPatientId(payload.patientId);
        const activeEnrollments = patientEnrollments.filter(
            (e) => e.status === PatientInsuranceEnrollmentStatus.ACTIVE
        );
        // A patient without any active enrollment yet always gets a primary — regardless of what was requested.
        const shouldBePrimary = payload.isPrimary || activeEnrollments.length === 0;

        const enrollment = PatientInsuranceEnrollment.create({
            clinicId: actor.clinicId,
            patientId: payload.patientId,
            insurancePlanId: payload.insurancePlanId,
            cardNumber: payload.cardNumber ?? null,
            validFrom: payload.validFrom ?? null,
            validUntil: payload.validUntil ?? null,
            isPrimary: shouldBePrimary,
        });

        if (shouldBePrimary) {
            for (const other of activeEnrollments) {
                if (other.isPrimary) {
                    other.unmarkAsPrimary();
                    await this.enrollmentRepository.save(other);
                }
            }
        }

        await this.enrollmentRepository.save(enrollment);

        this.eventDispatcher.dispatch(actor, enrollment);

        return new PatientInsuranceEnrollmentDto(enrollment);
    }
}
