import {Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {PatientContextSnapshot, PatientContextSnapshotId} from '../../domain/clinical-chat/entities';
import {PatientContextSnapshotRepository} from '../../domain/clinical-chat/patient-context-snapshot.repository';
import type {PatientId} from '../../domain/patient/entities';
import type {ProfessionalId} from '../../domain/professional/entities';
import {PatientContextSnapshotMapper} from '../mappers/patient-context-snapshot.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class PatientContextSnapshotPrismaRepository
    extends PrismaRepository
    implements PatientContextSnapshotRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientContextSnapshotMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PatientContextSnapshotId): Promise<PatientContextSnapshot | null> {
        const record = await this.prisma.patientContextSnapshot.findUnique({
            where: {id: id.toString()},
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByPatient(
        patientId: PatientId,
        professionalId?: ProfessionalId | null
    ): Promise<PatientContextSnapshot | null> {
        const record = await this.prisma.patientContextSnapshot.findFirst({
            where: {
                patientId: patientId.toString(),
                professionalId: professionalId ? professionalId.toString() : null,
            },
            orderBy: {updatedAt: 'desc'},
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async save(snapshot: PatientContextSnapshot): Promise<void> {
        const data = this.mapper.toPersistence(snapshot);
        // `patientFacts` é obrigatório no domínio; `criticalContext`/`timelineSummary` são opcionais.
        const writeData: Prisma.PatientContextSnapshotUncheckedCreateInput = {
            ...data,
            patientFacts: data.patientFacts as Prisma.InputJsonValue,
            criticalContext: data.criticalContext === null ? Prisma.JsonNull : (data.criticalContext as Prisma.InputJsonValue),
            timelineSummary: data.timelineSummary === null ? Prisma.JsonNull : (data.timelineSummary as Prisma.InputJsonValue),
        };
        // Quirk conhecido do Prisma: em unique composto com coluna nullable, o tipo gerado
        // exige `string` não-nulo. Em runtime, `null` é aceito e mapeia para `IS NULL` no SQL.
        const compoundUnique = {
            patientId: data.patientId,
            professionalId: data.professionalId as string,
        };
        await this.prisma.patientContextSnapshot.upsert({
            where: {patient_context_snapshot_unique: compoundUnique},
            create: writeData,
            update: writeData,
        });
    }
}
