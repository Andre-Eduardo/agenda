import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Prisma} from '@prisma/client';
import {PatientForm, PatientFormId} from '../../domain/patient-form/entities';
import {PatientFormRepository, PatientFormFilter, PatientFormSortOptions} from '../../domain/patient-form/patient-form.repository';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {toEnumOrNull} from '../../domain/@shared/utils';
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
        // Prisma distingue InputJsonValue (não-nulo) e JsonNull (sentinel) para colunas JSON.
        // `responseJson` é obrigatório no domínio; `computedJson` é opcional.
        const writeData: Prisma.PatientFormUncheckedCreateInput = {
            ...data,
            responseJson: data.responseJson as Prisma.InputJsonValue,
            computedJson: data.computedJson === null ? Prisma.JsonNull : (data.computedJson as Prisma.InputJsonValue),
        };
        await this.prisma.patientForm.upsert({
            where: {id: data.id},
            create: writeData,
            update: writeData,
        });
    }

    async search(
        pagination: Pagination<PatientFormSortOptions>,
        filter: PatientFormFilter = {}
    ): Promise<PaginatedList<PatientForm>> {
        const where: PrismaClient.Prisma.PatientFormWhereInput = {
            clinicId: filter.clinicId?.toString(),
            patientId: filter.patientId?.toString(),
            createdByMemberId: filter.createdByMemberId?.toString(),
            responsibleProfessionalId: filter.responsibleProfessionalId?.toString(),
            templateId: filter.templateId?.toString(),
            status: toEnumOrNull(PrismaClient.FormResponseStatus, filter.status) ?? undefined,
            template: filter.specialty
                ? {specialtyGroup: toEnumOrNull(PrismaClient.AiSpecialtyGroup, filter.specialty) ?? undefined}
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
