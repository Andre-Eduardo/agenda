import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PatientForm, PatientFormId} from '../../domain/patient-form/entities';
import {PatientFormRepository, PatientFormFilter, PatientFormSortOptions} from '../../domain/patient-form/patient-form.repository';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {PatientFormMapper} from '../mappers/patient-form.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class PatientFormPrismaRepository extends PrismaRepository implements PatientFormRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientFormMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PatientFormId): Promise<PatientForm | null> {
        const record = await this.prisma.patientForm.findUnique({
            where: {id: id.toString()},
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async save(form: PatientForm): Promise<void> {
        const data = this.mapper.toPersistence(form);
        await this.prisma.patientForm.upsert({
            where: {id: data.id},
            create: data as any,
            update: data as any,
        });
    }

    async search(
        pagination: Pagination<PatientFormSortOptions>,
        filter: PatientFormFilter = {}
    ): Promise<PaginatedList<PatientForm>> {
        const where: PrismaClient.Prisma.PatientFormWhereInput = {
            patientId: filter.patientId?.toString(),
            professionalId: filter.professionalId?.toString(),
            templateId: filter.templateId?.toString(),
            status: filter.status as PrismaClient.FormResponseStatus | undefined,
            template: filter.specialty
                ? {specialty: filter.specialty as PrismaClient.Specialty}
                : undefined,
        };

        const [data, totalCount] = await Promise.all([
            this.prisma.patientForm.findMany({
                where,
                ...this.normalizePagination(pagination, {appliedAt: 'desc'}),
            }),
            this.prisma.patientForm.count({where}),
        ]);

        return {
            data: data.map((item) => this.mapper.toDomain(item)),
            totalCount,
        };
    }
}
