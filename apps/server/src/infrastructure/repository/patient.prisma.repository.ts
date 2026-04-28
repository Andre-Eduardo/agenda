import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {ClinicId} from '../../domain/clinic/entities';
import {Patient, PatientId, type PatientAddressData} from '../../domain/patient/entities';
import {PatientRepository, PatientSearchFilter, PatientSortOptions} from '../../domain/patient/patient.repository';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {PatientMapper} from '../mappers/patient.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

export type PatientModel = PrismaClient.Patient;

const patientIncludes = {
    person: true,
    address: true,
    insurancePlan: true,
} as const;

@Injectable()
export class PatientPrismaRepository extends PrismaRepository implements PatientRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PatientId, clinicId?: ClinicId): Promise<Patient | null> {
        const patient = await this.prisma.patient.findFirst({
            where: {
                id: id.toString(),
                ...(clinicId ? {clinicId: clinicId.toString()} : {}),
            },
            include: patientIncludes,
        });

        return patient === null ? null : this.mapper.toDomain(patient);
    }

    async delete(id: PatientId): Promise<void> {
        await this.prisma.patient.delete({
            where: {id: id.toString()},
        });
    }

    async search(
        pagination: Pagination<PatientSortOptions>,
        filter: PatientSearchFilter = {}
    ): Promise<PaginatedList<Patient>> {
        const where: PrismaClient.Prisma.PatientWhereInput = {
            id: filter.ids ? {in: filter.ids.map((id) => id.toString())} : undefined,
            clinicId: filter.clinicId ? filter.clinicId.toString() : undefined,
            OR: filter.term
                ? [
                      {person: {name: {contains: filter.term, mode: 'insensitive'}}},
                      {documentId: {contains: filter.term}},
                  ]
                : undefined,
        };

        const [data, totalCount] = await Promise.all([
            this.prisma.patient.findMany({
                where,
                include: patientIncludes,
                ...this.normalizePagination(pagination, {createdAt: 'desc'}),
            }),
            this.prisma.patient.count({where}),
        ]);

        return {
            data: data.map((item) => this.mapper.toDomain(item)),
            totalCount,
        };
    }

    async save(patient: Patient): Promise<void> {
        const data = this.mapper.toPersistence(patient);
        const {person, address: _address, insurancePlan: _insurancePlan, clinicId, ...patientFields} = data;

        await this.prisma.$transaction(async (tx) => {
            await tx.person.upsert({
                where: {id: person.id},
                create: person,
                update: person,
            });
            await tx.patient.upsert({
                where: {id: patientFields.id},
                create: {...patientFields, clinicId},
                update: {...patientFields, clinicId},
            });

            if (patient.address !== null) {
                await this.upsertAddress(tx, patient.id.toString(), patient.clinicId.toString(), patient.address);
            }
        });
    }

    private async upsertAddress(
        tx: PrismaClient.Prisma.TransactionClient,
        patientId: string,
        clinicId: string,
        address: PatientAddressData,
    ): Promise<void> {
        const existing = await tx.patientAddress.findUnique({where: {patientId}});
        const now = new Date();

        if (existing === null) {
            const {randomUUID} = await import('node:crypto');

            await tx.patientAddress.create({
                data: {
                    id: randomUUID(),
                    patientId,
                    clinicId,
                    street: address.street,
                    number: address.number,
                    complement: address.complement,
                    neighborhood: address.neighborhood,
                    city: address.city,
                    state: address.state,
                    zipCode: address.zipCode,
                    country: address.country,
                    createdAt: now,
                    updatedAt: now,
                },
            });
        } else {
            await tx.patientAddress.update({
                where: {patientId},
                data: {
                    street: address.street,
                    number: address.number,
                    complement: address.complement,
                    neighborhood: address.neighborhood,
                    city: address.city,
                    state: address.state,
                    zipCode: address.zipCode,
                    country: address.country,
                    updatedAt: now,
                },
            });
        }
    }
}
