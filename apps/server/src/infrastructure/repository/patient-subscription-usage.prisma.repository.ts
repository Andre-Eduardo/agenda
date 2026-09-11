import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {
    PatientSubscriptionId,
    PatientSubscriptionUsage,
    PatientSubscriptionUsageId,
} from '@domain/patient-subscription/entities';
import {
    ConsumeAppointmentResult,
    PatientSubscriptionUsageRepository,
} from '@domain/patient-subscription/patient-subscription-usage.repository';
import {PatientSubscriptionUsageMapper} from '@infrastructure/mappers/patient-subscription-usage.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

type UsedRow = {appointments_used: number};

@Injectable()
export class PatientSubscriptionUsagePrismaRepository
    extends PrismaRepository
    implements PatientSubscriptionUsageRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientSubscriptionUsageMapper
    ) {
        super(prismaProvider);
    }

    async findCurrentPeriod(
        patientSubscriptionId: PatientSubscriptionId,
        periodYear: number,
        periodMonth: number
    ): Promise<PatientSubscriptionUsage | null> {
        const usage = await this.prisma.patientSubscriptionUsage.findFirst({
            where: {
                patientSubscriptionId: patientSubscriptionId.toString(),
                periodYear,
                periodMonth,
            },
        });

        return usage === null ? null : this.mapper.toDomain(usage);
    }

    async findByPatientSubscriptionId(
        patientSubscriptionId: PatientSubscriptionId
    ): Promise<PatientSubscriptionUsage[]> {
        const usages = await this.prisma.patientSubscriptionUsage.findMany({
            where: {patientSubscriptionId: patientSubscriptionId.toString()},
            orderBy: [{periodYear: 'desc'}, {periodMonth: 'desc'}],
        });

        return usages.map((u) => this.mapper.toDomain(u));
    }

    async save(usage: PatientSubscriptionUsage): Promise<void> {
        const data = this.mapper.toPersistence(usage);

        await this.prisma.patientSubscriptionUsage.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async consumeAppointment(id: PatientSubscriptionUsageId): Promise<ConsumeAppointmentResult> {
        const rows = await this.prisma.$queryRaw<UsedRow[]>`
            UPDATE "patient_subscription_usage"
            SET "appointments_used" = "appointments_used" + 1, "updated_at" = now()
            WHERE "id" = ${id.toString()} AND "appointments_used" < "quota_snapshot"
            RETURNING "appointments_used"
        `;

        return rows[0] ? {appointmentsUsed: rows[0].appointments_used} : null;
    }

    async refundAppointment(id: PatientSubscriptionUsageId): Promise<{appointmentsUsed: number}> {
        const rows = await this.prisma.$queryRaw<UsedRow[]>`
            UPDATE "patient_subscription_usage"
            SET "appointments_used" = GREATEST("appointments_used" - 1, 0), "updated_at" = now()
            WHERE "id" = ${id.toString()}
            RETURNING "appointments_used"
        `;

        const row = rows[0];

        if (!row) {
            throw new ResourceNotFoundException('patient_subscription_usage.not_found', id.toString());
        }

        return {appointmentsUsed: row.appointments_used};
    }
}
