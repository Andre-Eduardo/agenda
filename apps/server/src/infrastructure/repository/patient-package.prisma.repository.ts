import {Injectable} from '@nestjs/common';
import {PatientPackage, PatientPackageId} from '@domain/patient-package/entities';
import {ConsumeCreditResult, PatientPackageRepository} from '@domain/patient-package/patient-package.repository';
import {PatientId} from '@domain/patient/entities';
import {PatientPackageMapper} from '@infrastructure/mappers/patient-package.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class PatientPackagePrismaRepository extends PrismaRepository implements PatientPackageRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientPackageMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PatientPackageId): Promise<PatientPackage | null> {
        const patientPackage = await this.prisma.patientPackage.findFirst({
            where: {id: id.toString(), deletedAt: null},
        });

        return patientPackage === null ? null : this.mapper.toDomain(patientPackage);
    }

    async findByPatientId(patientId: PatientId): Promise<PatientPackage[]> {
        const packages = await this.prisma.patientPackage.findMany({
            where: {patientId: patientId.toString(), deletedAt: null},
            orderBy: {purchasedAt: 'desc'},
        });

        return packages.map((p) => this.mapper.toDomain(p));
    }

    async findExpirable(now: Date): Promise<PatientPackage[]> {
        const packages = await this.prisma.patientPackage.findMany({
            where: {status: 'ACTIVE', expiresAt: {lt: now}, deletedAt: null},
        });

        return packages.map((p) => this.mapper.toDomain(p));
    }

    async save(patientPackage: PatientPackage): Promise<void> {
        const data = this.mapper.toPersistence(patientPackage);

        await this.prisma.patientPackage.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async consumeCredit(id: PatientPackageId): Promise<ConsumeCreditResult> {
        const result = await this.prisma.patientPackage.updateMany({
            where: {id: id.toString(), remainingCredits: {gt: 0}, status: 'ACTIVE'},
            data: {remainingCredits: {decrement: 1}, updatedAt: new Date()},
        });

        if (result.count === 0) {
            return null;
        }

        const updated = await this.prisma.patientPackage.findUniqueOrThrow({where: {id: id.toString()}});

        if (updated.remainingCredits <= 0) {
            await this.prisma.patientPackage.updateMany({
                where: {id: id.toString(), remainingCredits: {lte: 0}},
                data: {status: 'DEPLETED'},
            });
        }

        return {remainingCredits: updated.remainingCredits};
    }

    async refundCredit(id: PatientPackageId): Promise<{remainingCredits: number}> {
        const updated = await this.prisma.patientPackage.update({
            where: {id: id.toString()},
            data: {remainingCredits: {increment: 1}, updatedAt: new Date()},
        });

        if (updated.remainingCredits > 0 && updated.status === 'DEPLETED') {
            const reactivated = await this.prisma.patientPackage.update({
                where: {id: id.toString()},
                data: {status: 'ACTIVE'},
            });

            return {remainingCredits: reactivated.remainingCredits};
        }

        return {remainingCredits: updated.remainingCredits};
    }
}
