import {Injectable} from '@nestjs/common';
import type {ClinicId} from '@domain/clinic/entities';
import type {PatientCommunicationPreferenceChange} from '@domain/patient-communication-preference/entities';
import {PatientCommunicationPreferenceRepository} from '@domain/patient-communication-preference/patient-communication-preference.repository';
import type {PatientId} from '@domain/patient/entities';
import {PatientCommunicationPreferenceChangeMapper} from '@infrastructure/mappers/patient-communication-preference-change.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class PatientCommunicationPreferencePrismaRepository
    extends PrismaRepository
    implements PatientCommunicationPreferenceRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientCommunicationPreferenceChangeMapper
    ) {
        super(prismaProvider);
    }

    async recordIfAbsent(change: PatientCommunicationPreferenceChange): Promise<boolean> {
        // The unique index on (source, external_id) turns a repeated webhook delivery into a no-op.
        // Staff changes have no external id, and NULLs never collide in a unique index.
        const {count} = await this.prisma.patientCommunicationPreferenceChange.createMany({
            data: [this.mapper.toPersistence(change)],
            skipDuplicates: true,
        });

        return count > 0;
    }

    async findHistory(clinicId: ClinicId, patientId: PatientId): Promise<PatientCommunicationPreferenceChange[]> {
        const records = await this.prisma.patientCommunicationPreferenceChange.findMany({
            where: {clinicId: clinicId.toString(), patientId: patientId.toString()},
            orderBy: [{occurredAt: 'desc'}, {createdAt: 'desc'}],
        });

        return records.map((record) => this.mapper.toDomain(record));
    }
}
