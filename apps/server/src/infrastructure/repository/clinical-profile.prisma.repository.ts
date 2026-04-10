import {Injectable} from '@nestjs/common';
import {ClinicalProfile, ClinicalProfileId} from '../../domain/clinical-profile/entities';
import {ClinicalProfileRepository} from '../../domain/clinical-profile/clinical-profile.repository';
import type {PatientId} from '../../domain/patient/entities';
import {ClinicalProfileMapper} from '../mappers/clinical-profile.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class ClinicalProfilePrismaRepository extends PrismaRepository implements ClinicalProfileRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: ClinicalProfileMapper
    ) {
        super(prismaProvider);
    }

    async findByPatientId(patientId: PatientId): Promise<ClinicalProfile | null> {
        const record = await this.prisma.clinicalProfile.findUnique({
            where: {patientId: patientId.toString()},
        });

        return record === null ? null : this.mapper.toDomain(record);
    }

    async findById(id: ClinicalProfileId): Promise<ClinicalProfile | null> {
        const record = await this.prisma.clinicalProfile.findUnique({
            where: {id: id.toString()},
        });

        return record === null ? null : this.mapper.toDomain(record);
    }

    async save(profile: ClinicalProfile): Promise<void> {
        const data = this.mapper.toPersistence(profile);
        await this.prisma.clinicalProfile.upsert({
            where: {patientId: data.patientId},
            create: data,
            update: data,
        });
    }
}
