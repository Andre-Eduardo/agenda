import {randomUUID} from 'node:crypto';
import {Injectable} from '@nestjs/common';
import {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import type {ClinicLicense} from '@domain/clinic-license/entities';
import type {ClinicId} from '@domain/clinic/entities';
import {ClinicLicenseMapper} from '@infrastructure/mappers/clinic-license.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class ClinicLicensePrismaRepository extends PrismaRepository implements ClinicLicenseRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: ClinicLicenseMapper
    ) {
        super(prismaProvider);
    }

    async findByClinicId(clinicId: ClinicId): Promise<ClinicLicense | null> {
        const license = await this.prisma.clinicLicense.findUnique({
            where: {clinicId: clinicId.toString()},
            include: {modules: true, assignments: true},
        });

        return license === null ? null : this.mapper.toDomain(license);
    }

    async save(license: ClinicLicense): Promise<void> {
        const data = this.mapper.toPersistence(license);

        await this.prismaProvider.runAtomically(async () => {
            await this.prisma.clinicLicense.upsert({
                where: {id: data.license.id},
                create: data.license,
                update: data.license,
            });

            await this.prisma.clinicLicenseModule.deleteMany({where: {licenseId: data.license.id}});
            await this.prisma.clinicModuleAssignment.deleteMany({where: {licenseId: data.license.id}});

            if (data.modules.length > 0) {
                await this.prisma.clinicLicenseModule.createMany({
                    data: data.modules.map((module) => ({...module, id: randomUUID()})),
                });
            }

            if (data.assignments.length > 0) {
                await this.prisma.clinicModuleAssignment.createMany({
                    data: data.assignments.map((assignment) => ({...assignment, id: randomUUID()})),
                });
            }
        });
    }
}
