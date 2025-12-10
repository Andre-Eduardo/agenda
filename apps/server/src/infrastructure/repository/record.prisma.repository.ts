import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PatientId} from '../../domain/patient/entities';
import {ProfessionalId} from '../../domain/professional/entities';
import {File, FileId} from '../../domain/record/entities/file.entity';
import {Record, RecordId} from '../../domain/record/entities/record.entity';
import {RecordRepository} from '../../domain/record/record.repository';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

// Define a type that includes the relation
type RecordWithFiles = PrismaClient.Record & {
    files: PrismaClient.File[];
};

@Injectable()
export class RecordPrismaRepository extends PrismaRepository implements RecordRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(record: RecordWithFiles): Record {
        return new Record({
            ...record,
            id: RecordId.from(record.id),
            patientId: PatientId.from(record.patientId),
            professionalId: ProfessionalId.from(record.professionalId),
            files: record.files.map(
                (file) =>
                    new File({
                        ...file,
                        id: FileId.from(file.id),
                        recordId: RecordId.from(file.recordId),
                    }),
            ),
        });
    }

    async findById(id: RecordId): Promise<Record | null> {
        const record = await this.prisma.record.findUnique({
            where: {
                id: id.toString(),
            },
            include: {
                files: true,
            },
        });

        return record === null ? null : RecordPrismaRepository.normalize(record);
    }

    async delete(id: RecordId): Promise<void> {
        await this.prisma.record.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
