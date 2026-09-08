import {Injectable} from '@nestjs/common';
import {PatientPackageCredit, PatientPackageId} from '@domain/patient-package/entities';
import {PatientPackageCreditRepository} from '@domain/patient-package/patient-package-credit.repository';
import {PatientPackageCreditMapper} from '@infrastructure/mappers/patient-package-credit.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class PatientPackageCreditPrismaRepository extends PrismaRepository implements PatientPackageCreditRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientPackageCreditMapper
    ) {
        super(prismaProvider);
    }

    async findByPatientPackageId(patientPackageId: PatientPackageId): Promise<PatientPackageCredit[]> {
        const credits = await this.prisma.patientPackageCredit.findMany({
            where: {patientPackageId: patientPackageId.toString()},
            orderBy: {createdAt: 'desc'},
        });

        return credits.map((c) => this.mapper.toDomain(c));
    }

    async save(credit: PatientPackageCredit): Promise<void> {
        const data = this.mapper.toPersistence(credit);

        await this.prisma.patientPackageCredit.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
