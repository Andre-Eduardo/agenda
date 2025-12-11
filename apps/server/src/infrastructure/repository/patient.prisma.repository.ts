import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Patient, PatientId} from '../../domain/patient/entities';
import {PatientRepository} from '../../domain/patient/patient.repository';
import {PatientMapper} from '../mappers/patient.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

export type PatientModel = PrismaClient.Patient;

@Injectable()
export class PatientPrismaRepository extends PrismaRepository implements PatientRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PatientId): Promise<Patient | null> {
        const patient = await this.prisma.patient.findUnique({
            where: {
                id: id.toString(),
            },
            include: {
                person: true,
            },
        });

        return patient === null ? null : this.mapper.toDomain(patient);
    }

    async delete(id: PatientId): Promise<void> {
        await this.prisma.patient.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
