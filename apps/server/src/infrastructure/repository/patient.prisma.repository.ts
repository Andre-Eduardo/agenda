import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Patient, PatientId} from '../../domain/patient/entities';
import {PatientRepository} from '../../domain/patient/patient.repository';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type PatientModel = PrismaClient.Patient;

@Injectable()
export class PatientPrismaRepository extends PrismaRepository implements PatientRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(patient: PatientModel): Patient {
        return new Patient({
            ...patient,
            id: PatientId.from(patient.id),
        });
    }

    async findById(id: PatientId): Promise<Patient | null> {
        const patient = await this.prisma.patient.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return patient === null ? null : PatientPrismaRepository.normalize(patient);
    }

    async delete(id: PatientId): Promise<void> {
        await this.prisma.patient.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
