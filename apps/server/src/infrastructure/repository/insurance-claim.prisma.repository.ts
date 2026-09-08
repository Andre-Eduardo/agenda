import {Injectable} from '@nestjs/common';
import {AppointmentPaymentId} from '@domain/appointment-payment/entities';
import {InsuranceClaim, InsuranceClaimId} from '@domain/insurance-claim/entities';
import {InsuranceClaimRepository, InsuranceClaimSearchFilter} from '@domain/insurance-claim/insurance-claim.repository';
import {InsuranceClaimMapper} from '@infrastructure/mappers/insurance-claim.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class InsuranceClaimPrismaRepository extends PrismaRepository implements InsuranceClaimRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: InsuranceClaimMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: InsuranceClaimId): Promise<InsuranceClaim | null> {
        const claim = await this.prisma.insuranceClaim.findUnique({
            where: {id: id.toString()},
        });

        return claim === null ? null : this.mapper.toDomain(claim);
    }

    async findByAppointmentPaymentId(appointmentPaymentId: AppointmentPaymentId): Promise<InsuranceClaim | null> {
        const claim = await this.prisma.insuranceClaim.findUnique({
            where: {appointmentPaymentId: appointmentPaymentId.toString()},
        });

        return claim === null ? null : this.mapper.toDomain(claim);
    }

    async search(filter: InsuranceClaimSearchFilter): Promise<InsuranceClaim[]> {
        const claims = await this.prisma.insuranceClaim.findMany({
            where: {
                clinicId: filter.clinicId.toString(),
                claimStatus: filter.claimStatus ? {in: filter.claimStatus} : undefined,
            },
            orderBy: {createdAt: 'desc'},
        });

        return claims.map((c) => this.mapper.toDomain(c));
    }

    async save(claim: InsuranceClaim): Promise<void> {
        const data = this.mapper.toPersistence(claim);

        await this.prisma.insuranceClaim.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
