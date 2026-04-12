import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {FormTemplateVersion, FormTemplateVersionId, FormStatus} from '../../domain/form-template-version/entities';
import {FormTemplateId} from '../../domain/form-template/entities';
import {MapperWithoutDto} from './mapper';
import type {FormDefinitionJson} from '../../domain/form-template/types';

export type FormTemplateVersionModel = PrismaClient.FormTemplateVersion;

@Injectable()
export class FormTemplateVersionMapper extends MapperWithoutDto<FormTemplateVersion, FormTemplateVersionModel> {
    toDomain(model: FormTemplateVersionModel): FormTemplateVersion {
        return new FormTemplateVersion({
            id: FormTemplateVersionId.from(model.id),
            templateId: FormTemplateId.from(model.templateId),
            versionNumber: model.versionNumber,
            status: model.status as unknown as FormStatus,
            definitionJson: model.definitionJson as unknown as FormDefinitionJson,
            schemaJson: model.schemaJson ?? null,
            publishedAt: model.publishedAt ?? null,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: FormTemplateVersion): FormTemplateVersionModel {
        return {
            id: entity.id.toString(),
            templateId: entity.templateId.toString(),
            versionNumber: entity.versionNumber,
            status: entity.status as unknown as PrismaClient.FormStatus,
            definitionJson: entity.definitionJson as unknown as PrismaClient.Prisma.JsonValue,
            schemaJson: entity.schemaJson ? (entity.schemaJson as PrismaClient.Prisma.JsonValue) : null,
            publishedAt: entity.publishedAt ?? null,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
