import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '../../domain/@shared/utils';
import {ClinicId} from '../../domain/clinic/entities';
import {
    ClinicalDocumentTemplate,
    ClinicalDocumentTemplateId,
    ClinicalDocumentType,
} from '../../domain/clinical-document/entities';
import {MapperWithoutDto} from './mapper';

export type ClinicalDocumentTemplateModel = PrismaClient.ClinicalDocumentTemplate;

@Injectable()
export class ClinicalDocumentTemplateMapper extends MapperWithoutDto<
    ClinicalDocumentTemplate,
    ClinicalDocumentTemplateModel
> {
    toDomain(model: ClinicalDocumentTemplateModel): ClinicalDocumentTemplate {
        return new ClinicalDocumentTemplate({
            id: ClinicalDocumentTemplateId.from(model.id),
            clinicId: model.clinicId ? ClinicId.from(model.clinicId) : null,
            type: toEnum(ClinicalDocumentType, model.type),
            isDefault: model.isDefault,
            name: model.name,
            layoutJson: model.layoutJson as Record<string, unknown>,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: ClinicalDocumentTemplate): ClinicalDocumentTemplateModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId?.toString() ?? null,
            type: toEnum(PrismaClient.ClinicalDocumentType, entity.type),
            isDefault: entity.isDefault,
            name: entity.name,
            layoutJson: entity.layoutJson as PrismaClient.Prisma.JsonValue,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
