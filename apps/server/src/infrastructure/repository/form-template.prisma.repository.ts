import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {ClinicId} from '../../domain/clinic/entities';
import {ClinicMemberId} from '../../domain/clinic-member/entities';
import {FormTemplate, FormTemplateId} from '../../domain/form-template/entities';
import {
    FormTemplateRepository,
    FormTemplateFilter,
    FormTemplateSortOptions,
} from '../../domain/form-template/form-template.repository';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {FormTemplateMapper} from '../mappers/form-template.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class FormTemplatePrismaRepository extends PrismaRepository implements FormTemplateRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: FormTemplateMapper,
    ) {
        super(prismaProvider);
    }

    async findById(id: FormTemplateId): Promise<FormTemplate | null> {
        const record = await this.prisma.formTemplate.findUnique({
            where: {id: id.toString(), deletedAt: null},
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByCode(code: string): Promise<FormTemplate | null> {
        const record = await this.prisma.formTemplate.findFirst({
            where: {code, deletedAt: null},
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async save(template: FormTemplate): Promise<void> {
        const data = this.mapper.toPersistence(template);
        await this.prisma.formTemplate.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async search(
        pagination: Pagination<FormTemplateSortOptions>,
        filter: FormTemplateFilter = {},
    ): Promise<PaginatedList<FormTemplate>> {
        const where: PrismaClient.Prisma.FormTemplateWhereInput = {
            deletedAt: filter.includeDeleted ? undefined : null,
            specialtyLabel: filter.specialtyLabel,
            isPublic: filter.isPublic !== undefined ? filter.isPublic : undefined,
            clinicId: this.normalizeNullableId(filter.clinicId),
            createdByMemberId: this.normalizeNullableId(filter.createdByMemberId),
        };

        const [data, totalCount] = await Promise.all([
            this.prisma.formTemplate.findMany({
                where,
                ...this.normalizePagination(pagination, {createdAt: 'desc'}),
            }),
            this.prisma.formTemplate.count({where}),
        ]);

        return {
            data: data.map((item) => this.mapper.toDomain(item)),
            totalCount,
        };
    }

    private normalizeNullableId(
        value: ClinicId | ClinicMemberId | null | undefined,
    ): string | null | undefined {
        if (value === null) return null;
        if (value === undefined) return undefined;
        return value.toString();
    }
}
