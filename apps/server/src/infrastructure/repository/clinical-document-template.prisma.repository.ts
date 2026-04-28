import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Prisma} from '@prisma/client';
import {toEnum} from '../../domain/@shared/utils';
import {ClinicId} from '../../domain/clinic/entities';
import {
    ClinicalDocumentTemplate,
    ClinicalDocumentTemplateId,
    ClinicalDocumentType,
} from '../../domain/clinical-document/entities';
import {ClinicalDocumentTemplateRepository} from '../../domain/clinical-document/clinical-document-template.repository';
import {ClinicalDocumentTemplateMapper} from '../mappers/clinical-document-template.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class ClinicalDocumentTemplatePrismaRepository
    extends PrismaRepository
    implements ClinicalDocumentTemplateRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: ClinicalDocumentTemplateMapper,
    ) {
        super(prismaProvider);
    }

    async findById(id: ClinicalDocumentTemplateId): Promise<ClinicalDocumentTemplate | null> {
        const model = await this.prisma.clinicalDocumentTemplate.findUnique({
            where: {id: id.toString()},
        });

        return model ? this.mapper.toDomain(model) : null;
    }

    async findByClinicAndType(
        clinicId: ClinicId,
        type: ClinicalDocumentType,
    ): Promise<ClinicalDocumentTemplate | null> {
        const model = await this.prisma.clinicalDocumentTemplate.findFirst({
            where: {
                clinicId: clinicId.toString(),
                type: toEnum(PrismaClient.ClinicalDocumentType, type),
            },
        });

        return model ? this.mapper.toDomain(model) : null;
    }

    async findDefaultByType(type: ClinicalDocumentType): Promise<ClinicalDocumentTemplate | null> {
        const model = await this.prisma.clinicalDocumentTemplate.findFirst({
            where: {
                clinicId: null,
                isDefault: true,
                type: toEnum(PrismaClient.ClinicalDocumentType, type),
            },
        });

        return model ? this.mapper.toDomain(model) : null;
    }

    async findAllByClinic(clinicId: ClinicId): Promise<ClinicalDocumentTemplate[]> {
        const models = await this.prisma.clinicalDocumentTemplate.findMany({
            where: {clinicId: clinicId.toString()},
            orderBy: {type: 'asc'},
        });

        return models.map((m) => this.mapper.toDomain(m));
    }

    async save(template: ClinicalDocumentTemplate): Promise<void> {
        const data = this.mapper.toPersistence(template);
        const writeData: Prisma.ClinicalDocumentTemplateUncheckedCreateInput = {
            ...data,
            layoutJson: data.layoutJson as Prisma.InputJsonValue,
        };

        await this.prisma.clinicalDocumentTemplate.upsert({
            where: {id: data.id},
            create: writeData,
            update: writeData,
        });
    }
}
