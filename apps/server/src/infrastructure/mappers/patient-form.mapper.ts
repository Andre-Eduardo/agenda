import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PatientForm, PatientFormId, FormResponseStatus} from '../../domain/patient-form/entities';
import {PatientId} from '../../domain/patient/entities';
import {ProfessionalId} from '../../domain/professional/entities';
import {FormTemplateId} from '../../domain/form-template/entities';
import {FormTemplateVersionId} from '../../domain/form-template-version/entities';
import {MapperWithoutDto} from './mapper';
import type {FormResponseJson, FormComputedJson} from '../../domain/form-template/types';

export type PatientFormModel = PrismaClient.PatientForm;

@Injectable()
export class PatientFormMapper extends MapperWithoutDto<PatientForm, PatientFormModel> {
    toDomain(model: PatientFormModel): PatientForm {
        return new PatientForm({
            id: PatientFormId.from(model.id),
            patientId: PatientId.from(model.patientId),
            professionalId: ProfessionalId.from(model.professionalId),
            templateId: FormTemplateId.from(model.templateId),
            versionId: FormTemplateVersionId.from(model.versionId),
            status: model.status as unknown as FormResponseStatus,
            responseJson: model.responseJson as unknown as FormResponseJson,
            computedJson: model.computedJson ? (model.computedJson as unknown as FormComputedJson) : null,
            appliedAt: model.appliedAt,
            completedAt: model.completedAt ?? null,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: PatientForm): PatientFormModel {
        return {
            id: entity.id.toString(),
            patientId: entity.patientId.toString(),
            professionalId: entity.professionalId.toString(),
            templateId: entity.templateId.toString(),
            versionId: entity.versionId.toString(),
            status: entity.status as unknown as PrismaClient.FormResponseStatus,
            responseJson: entity.responseJson as unknown as PrismaClient.Prisma.InputJsonValue,
            computedJson: entity.computedJson
                ? (entity.computedJson as unknown as PrismaClient.Prisma.InputJsonValue)
                : null,
            appliedAt: entity.appliedAt,
            completedAt: entity.completedAt ?? null,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
