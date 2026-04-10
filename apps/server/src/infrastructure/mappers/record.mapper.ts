import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PatientId} from '../../domain/patient/entities';
import {ProfessionalId} from '../../domain/professional/entities';
import {AppointmentId} from '../../domain/appointment/entities';
import {File, FileId} from '../../domain/record/entities/file.entity';
import {
    Record,
    RecordId,
    ImportedDocumentId,
    EvolutionTemplateType,
    AttendanceType,
    ClinicalStatusTag,
    ConductTag,
    RecordSource,
} from '../../domain/record/entities/record.entity';
import {MapperWithoutDto} from './mapper';

export type RecordModel = PrismaClient.Record & {
    files?: PrismaClient.File[];
};

@Injectable()
export class RecordMapper extends MapperWithoutDto<Record, RecordModel> {
    toDomain(model: RecordModel): Record {
        return new Record({
            ...model,
            id: RecordId.from(model.id),
            patientId: PatientId.from(model.patientId),
            professionalId: ProfessionalId.from(model.professionalId),
            description: model.description ?? null,
            templateType: model.templateType ? (model.templateType as unknown as EvolutionTemplateType) : null,
            title: model.title ?? null,
            attendanceType: model.attendanceType ? (model.attendanceType as unknown as AttendanceType) : null,
            clinicalStatus: model.clinicalStatus ? (model.clinicalStatus as unknown as ClinicalStatusTag) : null,
            conductTags: (model.conductTags ?? []) as unknown as ConductTag[],
            subjective: model.subjective ?? null,
            objective: model.objective ?? null,
            assessment: model.assessment ?? null,
            plan: model.plan ?? null,
            freeNotes: model.freeNotes ?? null,
            eventDate: model.eventDate ?? null,
            appointmentId: model.appointmentId ? AppointmentId.from(model.appointmentId) : null,
            source: model.source ? (model.source as unknown as RecordSource) : RecordSource.MANUAL,
            importedDocumentId: model.importedDocumentId ? ImportedDocumentId.from(model.importedDocumentId) : null,
            wasHumanEdited: model.wasHumanEdited ?? false,
            files:
                model.files?.map(
                    (file) =>
                        new File({
                            ...file,
                            id: FileId.from(file.id),
                            recordId: file.recordId ? RecordId.from(file.recordId) : null,
                            patientId: file.patientId ? PatientId.from(file.patientId) : null,
                            deletedAt: file.deletedAt ?? null,
                        })
                ) ?? [],
        });
    }

    toPersistence(entity: Record): RecordModel {
        return {
            id: entity.id.toString(),
            patientId: entity.patientId.toString(),
            professionalId: entity.professionalId.toString(),
            description: entity.description,
            templateType: entity.templateType ? (entity.templateType as unknown as PrismaClient.EvolutionTemplateType) : null,
            title: entity.title,
            attendanceType: entity.attendanceType ? (entity.attendanceType as unknown as PrismaClient.AttendanceType) : null,
            clinicalStatus: entity.clinicalStatus ? (entity.clinicalStatus as unknown as PrismaClient.ClinicalStatusTag) : null,
            conductTags: (entity.conductTags ?? []) as unknown as PrismaClient.ConductTag[],
            subjective: entity.subjective,
            objective: entity.objective,
            assessment: entity.assessment,
            plan: entity.plan,
            freeNotes: entity.freeNotes,
            eventDate: entity.eventDate,
            appointmentId: entity.appointmentId?.toString() ?? null,
            source: entity.source as unknown as PrismaClient.RecordSource,
            importedDocumentId: entity.importedDocumentId?.toString() ?? null,
            wasHumanEdited: entity.wasHumanEdited,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
            files: entity.files.map((file) => ({
                id: file.id.toString(),
                recordId: file.recordId?.toString() ?? null,
                patientId: file.patientId?.toString() ?? null,
                fileName: file.fileName,
                url: file.url,
                description: file.description,
                createdAt: file.createdAt,
                updatedAt: file.updatedAt,
                deletedAt: file.deletedAt ?? null,
            })),
        };
    }
}
