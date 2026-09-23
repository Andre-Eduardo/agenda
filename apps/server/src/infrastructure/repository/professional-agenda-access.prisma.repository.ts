import {Injectable} from '@nestjs/common';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {ProfessionalAgendaAccess, ProfessionalAgendaAccessId} from '@domain/professional-agenda-access/entities';
import {ProfessionalAgendaAccessRepository} from '@domain/professional-agenda-access/professional-agenda-access.repository';
import {ProfessionalAgendaAccessMapper} from '@infrastructure/mappers/professional-agenda-access.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class ProfessionalAgendaAccessPrismaRepository
    extends PrismaRepository
    implements ProfessionalAgendaAccessRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: ProfessionalAgendaAccessMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: ProfessionalAgendaAccessId): Promise<ProfessionalAgendaAccess | null> {
        const access = await this.prisma.professionalAgendaAccess.findFirst({
            where: {id: id.toString(), deletedAt: null},
        });

        return access === null ? null : this.mapper.toDomain(access);
    }

    async findByGranteeAndProfessional(
        granteeMemberId: ClinicMemberId,
        professionalMemberId: ClinicMemberId
    ): Promise<ProfessionalAgendaAccess | null> {
        const access = await this.prisma.professionalAgendaAccess.findFirst({
            where: {
                granteeMemberId: granteeMemberId.toString(),
                professionalMemberId: professionalMemberId.toString(),
                deletedAt: null,
            },
        });

        return access === null ? null : this.mapper.toDomain(access);
    }

    async findByProfessionalId(
        clinicId: ClinicId,
        professionalMemberId: ClinicMemberId
    ): Promise<ProfessionalAgendaAccess[]> {
        const accesses = await this.prisma.professionalAgendaAccess.findMany({
            where: {
                clinicId: clinicId.toString(),
                professionalMemberId: professionalMemberId.toString(),
                deletedAt: null,
            },
        });

        return accesses.map((a) => this.mapper.toDomain(a));
    }

    async findByGranteeId(clinicId: ClinicId, granteeMemberId: ClinicMemberId): Promise<ProfessionalAgendaAccess[]> {
        const accesses = await this.prisma.professionalAgendaAccess.findMany({
            where: {
                clinicId: clinicId.toString(),
                granteeMemberId: granteeMemberId.toString(),
                deletedAt: null,
            },
        });

        return accesses.map((a) => this.mapper.toDomain(a));
    }

    async save(access: ProfessionalAgendaAccess): Promise<void> {
        const data = this.mapper.toPersistence(access);

        await this.prisma.professionalAgendaAccess.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
