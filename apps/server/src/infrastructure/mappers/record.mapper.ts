import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PatientId} from '../../domain/patient/entities';
import {ProfessionalId} from '../../domain/professional/entities';
import {File, FileId} from '../../domain/record/entities/file.entity';
import {Record, RecordId} from '../../domain/record/entities/record.entity';
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
            files:
                model.files?.map(
                    (file) =>
                        new File({
                            ...file,
                            id: FileId.from(file.id),
                            recordId: RecordId.from(file.recordId),
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
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
            // Files are usually handled separately or via nested writes, but for the model return:
            files: entity.files.map((file) => ({
                id: file.id.toString(),
                recordId: file.recordId.toString(),
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
