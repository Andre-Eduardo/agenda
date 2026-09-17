import {Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {PatientInsuranceEnrollmentRepository} from '@domain/patient-insurance-enrollment/patient-insurance-enrollment.repository';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class ExpirePatientInsuranceEnrollmentsJob {
    private readonly logger = new Logger(ExpirePatientInsuranceEnrollmentsJob.name);

    constructor(
        private readonly enrollmentRepository: PatientInsuranceEnrollmentRepository,
        private readonly patientRepository: PatientRepository
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handle(): Promise<void> {
        const expirable = await this.enrollmentRepository.findExpirable(new Date());

        for (const enrollment of expirable) {
            const wasPrimary = enrollment.isPrimary;

            enrollment.expire();
            await this.enrollmentRepository.save(enrollment);

            if (!wasPrimary) {
                continue;
            }

            const patient = await this.patientRepository.findById(enrollment.patientId, enrollment.clinicId);

            if (patient === null) {
                continue;
            }

            patient.change({
                insurancePlanId: null,
                insuranceCardNumber: null,
                insuranceValidUntil: null,
            });
            await this.patientRepository.save(patient);
        }

        if (expirable.length > 0) {
            this.logger.log(`Expired ${expirable.length} patient insurance enrollments`);
        }
    }
}
