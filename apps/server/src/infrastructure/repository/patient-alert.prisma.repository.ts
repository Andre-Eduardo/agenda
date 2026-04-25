import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PatientAlert, PatientAlertId} from '../../domain/patient-alert/entities';
import {PatientAlertRepository, PatientAlertSearchFilter, PatientAlertSortOptions} from '../../domain/patient-alert/patient-alert.repository';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {PatientAlertMapper} from '../mappers/patient-alert.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class PatientAlertPrismaRepository extends PrismaRepository implements PatientAlertRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientAlertMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PatientAlertId): Promise<PatientAlert | null> {
        const record = await this.prisma.patientAlert.findUnique({
            where: {id: id.toString()},
        });

        return record === null ? null : this.mapper.toDomain(record);
    }

    async save(alert: PatientAlert): Promise<void> {
        const data = this.mapper.toPersistence(alert);
        await this.prisma.patientAlert.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async delete(id: PatientAlertId): Promise<void> {
        await this.prisma.patientAlert.update({
            where: {id: id.toString()},
            data: {deletedAt: new Date()},
        });
    }

    async search(
        pagination: Pagination<PatientAlertSortOptions>,
        filter: PatientAlertSearchFilter = {}
    ): Promise<PaginatedList<PatientAlert>> {
        const where: PrismaClient.Prisma.PatientAlertWhereInput = {
            clinicId: filter.clinicId ? filter.clinicId.toString() : undefined,
            patientId: filter.patientId ? filter.patientId.toString() : undefined,
            createdByMemberId: filter.createdByMemberId ? filter.createdByMemberId.toString() : undefined,
            isActive: filter.isActive !== undefined ? filter.isActive : undefined,
            deletedAt: null,
        };

        const [data, totalCount] = await Promise.all([
            this.prisma.patientAlert.findMany({
                where,
                ...this.normalizePagination(pagination, {isActive: 'desc', createdAt: 'desc'}),
            }),
            this.prisma.patientAlert.count({where}),
        ]);

        return {
            data: data.map((item) => this.mapper.toDomain(item)),
            totalCount,
        };
    }
}
