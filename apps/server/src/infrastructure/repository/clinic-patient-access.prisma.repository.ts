import {Injectable} from '@nestjs/common';
import {ClinicId} from '../../domain/clinic/entities';
import {ClinicMemberId} from '../../domain/clinic-member/entities';
import {ClinicPatientAccess, ClinicPatientAccessId} from '../../domain/clinic-patient-access/entities';
import {ClinicPatientAccessRepository} from '../../domain/clinic-patient-access/clinic-patient-access.repository';
import {PatientId} from '../../domain/patient/entities';
import {ClinicPatientAccessMapper} from '../mappers/clinic-patient-access.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class ClinicPatientAccessPrismaRepository
    extends PrismaRepository
    implements ClinicPatientAccessRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: ClinicPatientAccessMapper,
    ) {
        super(prismaProvider);
    }

    async findById(id: ClinicPatientAccessId): Promise<ClinicPatientAccess | null> {
        const access = await this.prisma.clinicPatientAccess.findFirst({
            where: {id: id.toString()},
        });
        return access === null ? null : this.mapper.toDomain(access);
    }

    async findByMemberAndPatient(
        memberId: ClinicMemberId,
        patientId: PatientId,
    ): Promise<ClinicPatientAccess | null> {
        const access = await this.prisma.clinicPatientAccess.findFirst({
            where: {
                memberId: memberId.toString(),
                patientId: patientId.toString(),
                deletedAt: null,
            },
        });
        return access === null ? null : this.mapper.toDomain(access);
    }

    async findByPatientId(clinicId: ClinicId, patientId: PatientId): Promise<ClinicPatientAccess[]> {
        const accesses = await this.prisma.clinicPatientAccess.findMany({
            where: {clinicId: clinicId.toString(), patientId: patientId.toString(), deletedAt: null},
        });
        return accesses.map((a) => this.mapper.toDomain(a));
    }

    async findByMemberId(clinicId: ClinicId, memberId: ClinicMemberId): Promise<ClinicPatientAccess[]> {
        const accesses = await this.prisma.clinicPatientAccess.findMany({
            where: {clinicId: clinicId.toString(), memberId: memberId.toString(), deletedAt: null},
        });
        return accesses.map((a) => this.mapper.toDomain(a));
    }

    async save(access: ClinicPatientAccess): Promise<void> {
        const data = this.mapper.toPersistence(access);
        await this.prisma.clinicPatientAccess.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
