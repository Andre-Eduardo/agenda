import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {FormTemplate, FormTemplateId, Specialty} from '../../domain/form-template/entities';
import {ProfessionalId} from '../../domain/professional/entities';
import {MapperWithoutDto} from './mapper';

export type FormTemplateModel = PrismaClient.FormTemplate;

@Injectable()
export class FormTemplateMapper extends MapperWithoutDto<FormTemplate, FormTemplateModel> {
    toDomain(model: FormTemplateModel): FormTemplate {
        return new FormTemplate({
            id: FormTemplateId.from(model.id),
            code: model.code,
            name: model.name,
            description: model.description ?? null,
            specialty: model.specialty as unknown as Specialty,
            isPublic: model.isPublic,
            professionalId: model.professionalId ? ProfessionalId.from(model.professionalId) : null,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: FormTemplate): FormTemplateModel {
        return {
            id: entity.id.toString(),
            code: entity.code,
            name: entity.name,
            description: entity.description,
            specialty: entity.specialty as unknown as PrismaClient.Specialty,
            isPublic: entity.isPublic,
            professionalId: entity.professionalId?.toString() ?? null,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
