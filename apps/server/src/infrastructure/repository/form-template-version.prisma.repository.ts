import {Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {FormTemplateVersion, FormTemplateVersionId} from '../../domain/form-template-version/entities';
import {FormTemplateVersionRepository} from '../../domain/form-template-version/form-template-version.repository';
import {FormTemplateId} from '../../domain/form-template/entities';
import {FormTemplateVersionMapper} from '../mappers/form-template-version.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class FormTemplateVersionPrismaRepository
    extends PrismaRepository
    implements FormTemplateVersionRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: FormTemplateVersionMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: FormTemplateVersionId): Promise<FormTemplateVersion | null> {
        const record = await this.prisma.formTemplateVersion.findUnique({
            where: {id: id.toString()},
        });

        return record ? this.mapper.toDomain(record) : null;
    }

    async findByTemplateAndVersion(
        templateId: FormTemplateId,
        versionNumber: number
    ): Promise<FormTemplateVersion | null> {
        const record = await this.prisma.formTemplateVersion.findFirst({
            where: {templateId: templateId.toString(), versionNumber},
        });

        return record ? this.mapper.toDomain(record) : null;
    }

    async findLatestPublished(templateId: FormTemplateId): Promise<FormTemplateVersion | null> {
        const record = await this.prisma.formTemplateVersion.findFirst({
            where: {templateId: templateId.toString(), status: 'PUBLISHED'},
            orderBy: {versionNumber: 'desc'},
        });

        return record ? this.mapper.toDomain(record) : null;
    }

    async findNextVersionNumber(templateId: FormTemplateId): Promise<number> {
        const latest = await this.prisma.formTemplateVersion.findFirst({
            where: {templateId: templateId.toString()},
            orderBy: {versionNumber: 'desc'},
            select: {versionNumber: true},
        });

        return (latest?.versionNumber ?? 0) + 1;
    }

    async listByTemplate(templateId: FormTemplateId): Promise<FormTemplateVersion[]> {
        const records = await this.prisma.formTemplateVersion.findMany({
            where: {templateId: templateId.toString()},
            orderBy: {versionNumber: 'desc'},
        });

        return records.map((r) => this.mapper.toDomain(r));
    }

    async save(version: FormTemplateVersion): Promise<void> {
        const data = this.mapper.toPersistence(version);
        // `definitionJson` é obrigatório no domínio; `schemaJson` é opcional (usa sentinel JsonNull).
        const writeData: Prisma.FormTemplateVersionUncheckedCreateInput = {
            ...data,
            definitionJson: data.definitionJson as Prisma.InputJsonValue,
            schemaJson: data.schemaJson === null ? Prisma.JsonNull : (data.schemaJson as Prisma.InputJsonValue),
        };

        await this.prisma.formTemplateVersion.upsert({
            where: {id: data.id},
            create: writeData,
            update: writeData,
        });
    }
}
