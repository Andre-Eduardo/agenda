import {Injectable} from '@nestjs/common';
import {ClinicId} from '@domain/clinic/entities';
import {PatientSubscriptionPlan, PatientSubscriptionPlanId} from '@domain/patient-subscription-plan/entities';
import {PatientSubscriptionPlanRepository} from '@domain/patient-subscription-plan/patient-subscription-plan.repository';
import {PatientSubscriptionPlanMapper} from '@infrastructure/mappers/patient-subscription-plan.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class PatientSubscriptionPlanPrismaRepository
    extends PrismaRepository
    implements PatientSubscriptionPlanRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientSubscriptionPlanMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PatientSubscriptionPlanId): Promise<PatientSubscriptionPlan | null> {
        const plan = await this.prisma.patientSubscriptionPlan.findFirst({
            where: {id: id.toString(), deletedAt: null},
        });

        return plan === null ? null : this.mapper.toDomain(plan);
    }

    async findByClinicId(clinicId: ClinicId): Promise<PatientSubscriptionPlan[]> {
        const plans = await this.prisma.patientSubscriptionPlan.findMany({
            where: {clinicId: clinicId.toString(), deletedAt: null},
            orderBy: {name: 'asc'},
        });

        return plans.map((p) => this.mapper.toDomain(p));
    }

    async save(plan: PatientSubscriptionPlan): Promise<void> {
        const data = this.mapper.toPersistence(plan);

        await this.prisma.patientSubscriptionPlan.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
