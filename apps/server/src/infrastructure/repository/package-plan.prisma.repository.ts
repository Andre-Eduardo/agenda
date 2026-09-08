import {Injectable} from '@nestjs/common';
import {ClinicId} from '@domain/clinic/entities';
import {PackagePlan, PackagePlanId} from '@domain/package-plan/entities';
import {PackagePlanRepository} from '@domain/package-plan/package-plan.repository';
import {PackagePlanMapper} from '@infrastructure/mappers/package-plan.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class PackagePlanPrismaRepository extends PrismaRepository implements PackagePlanRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PackagePlanMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PackagePlanId): Promise<PackagePlan | null> {
        const plan = await this.prisma.packagePlan.findFirst({
            where: {id: id.toString(), deletedAt: null},
        });

        return plan === null ? null : this.mapper.toDomain(plan);
    }

    async findByClinicId(clinicId: ClinicId): Promise<PackagePlan[]> {
        const plans = await this.prisma.packagePlan.findMany({
            where: {clinicId: clinicId.toString(), deletedAt: null},
            orderBy: {name: 'asc'},
        });

        return plans.map((p) => this.mapper.toDomain(p));
    }

    async save(plan: PackagePlan): Promise<void> {
        const data = this.mapper.toPersistence(plan);

        await this.prisma.packagePlan.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
