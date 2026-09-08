import {Injectable} from '@nestjs/common';
import {InsurancePlanId} from '@domain/insurance-plan/entities';
import {
    PatientInsuranceEnrollment,
    PatientInsuranceEnrollmentId,
} from '@domain/patient-insurance-enrollment/entities';
import {PatientInsuranceEnrollmentRepository} from '@domain/patient-insurance-enrollment/patient-insurance-enrollment.repository';
import {PatientId} from '@domain/patient/entities';
import {PatientInsuranceEnrollmentMapper} from '@infrastructure/mappers/patient-insurance-enrollment.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class PatientInsuranceEnrollmentPrismaRepository
    extends PrismaRepository
    implements PatientInsuranceEnrollmentRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientInsuranceEnrollmentMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PatientInsuranceEnrollmentId): Promise<PatientInsuranceEnrollment | null> {
        const enrollment = await this.prisma.patientInsuranceEnrollment.findFirst({
            where: {id: id.toString(), deletedAt: null},
        });

        return enrollment === null ? null : this.mapper.toDomain(enrollment);
    }

    async findByPatientId(patientId: PatientId): Promise<PatientInsuranceEnrollment[]> {
        const enrollments = await this.prisma.patientInsuranceEnrollment.findMany({
            where: {patientId: patientId.toString(), deletedAt: null},
            orderBy: [{isPrimary: 'desc'}, {createdAt: 'asc'}],
        });

        return enrollments.map((e) => this.mapper.toDomain(e));
    }

    async findByPatientAndPlan(
        patientId: PatientId,
        insurancePlanId: InsurancePlanId
    ): Promise<PatientInsuranceEnrollment | null> {
        const enrollment = await this.prisma.patientInsuranceEnrollment.findFirst({
            where: {
                patientId: patientId.toString(),
                insurancePlanId: insurancePlanId.toString(),
                deletedAt: null,
            },
        });

        return enrollment === null ? null : this.mapper.toDomain(enrollment);
    }

    async findOtherActiveByPatientId(
        patientId: PatientId,
        excludeId: PatientInsuranceEnrollmentId
    ): Promise<PatientInsuranceEnrollment[]> {
        const enrollments = await this.prisma.patientInsuranceEnrollment.findMany({
            where: {
                patientId: patientId.toString(),
                id: {not: excludeId.toString()},
                status: 'ACTIVE',
                deletedAt: null,
            },
        });

        return enrollments.map((e) => this.mapper.toDomain(e));
    }

    async save(enrollment: PatientInsuranceEnrollment): Promise<void> {
        const data = this.mapper.toPersistence(enrollment);

        await this.prisma.patientInsuranceEnrollment.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
