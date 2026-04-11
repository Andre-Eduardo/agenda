import {Injectable} from '@nestjs/common';
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
        await this.prisma.patientContextSnapshot.upsert({
            where: {
                patient_context_snapshot_unique: {
                    patientId: data.patientId,
                    professionalId: data.professionalId ?? null,
                },
            },
            create: data,
            update: data,
        });
    }
}
