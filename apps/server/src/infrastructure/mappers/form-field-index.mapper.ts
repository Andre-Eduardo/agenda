import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '../../domain/@shared/utils';
import {FormFieldIndex, FormFieldIndexId} from '../../domain/form-field-index/entities';
import {PatientFormId} from '../../domain/patient-form/entities';
import {Specialty} from '../../domain/form-template/entities';
import {MapperWithoutDto} from './mapper';

export type FormFieldIndexModel = PrismaClient.FormFieldIndex;

@Injectable()
export class FormFieldIndexMapper extends MapperWithoutDto<FormFieldIndex, FormFieldIndexModel> {
    toDomain(model: FormFieldIndexModel): FormFieldIndex {
        return new FormFieldIndex({
            id: FormFieldIndexId.from(model.id),
            patientFormId: PatientFormId.from(model.patientFormId),
            fieldId: model.fieldId,
            fieldLabel: model.fieldLabel ?? null,
            fieldType: model.fieldType ?? null,
            valueText: model.valueText ?? null,
            valueNumber: model.valueNumber ?? null,
            valueBoolean: model.valueBoolean ?? null,
            valueDate: model.valueDate ?? null,
            valueJson: model.valueJson ?? null,
            specialty: toEnum(Specialty, model.specialty),
            confidence: model.confidence ?? null,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }

    toPersistence(entity: FormFieldIndex): FormFieldIndexModel {
        return {
            id: entity.id.toString(),
            patientFormId: entity.patientFormId.toString(),
            fieldId: entity.fieldId,
            fieldLabel: entity.fieldLabel,
            fieldType: entity.fieldType,
            valueText: entity.valueText,
            valueNumber: entity.valueNumber,
            valueBoolean: entity.valueBoolean,
            valueDate: entity.valueDate ?? null,
            valueJson: entity.valueJson ? (entity.valueJson as PrismaClient.Prisma.JsonValue) : null,
            specialty: toEnum(PrismaClient.Specialty, entity.specialty),
            confidence: entity.confidence,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
