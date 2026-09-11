import {Injectable} from '@nestjs/common';
import {PatientSubscription, PatientSubscriptionId} from '@domain/patient-subscription/entities';
import {PatientSubscriptionRepository} from '@domain/patient-subscription/patient-subscription.repository';
import {PatientId} from '@domain/patient/entities';
import {PatientSubscriptionMapper} from '@infrastructure/mappers/patient-subscription.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class PatientSubscriptionPrismaRepository extends PrismaRepository implements PatientSubscriptionRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientSubscriptionMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PatientSubscriptionId): Promise<PatientSubscription | null> {
        const subscription = await this.prisma.patientSubscription.findFirst({
            where: {id: id.toString(), deletedAt: null},
        });

        return subscription === null ? null : this.mapper.toDomain(subscription);
    }

    async findByPatientId(patientId: PatientId): Promise<PatientSubscription[]> {
        const subscriptions = await this.prisma.patientSubscription.findMany({
            where: {patientId: patientId.toString(), deletedAt: null},
            orderBy: {createdAt: 'desc'},
        });

        return subscriptions.map((s) => this.mapper.toDomain(s));
    }

    async findActiveByPatientId(patientId: PatientId): Promise<PatientSubscription | null> {
        const subscription = await this.prisma.patientSubscription.findFirst({
            where: {patientId: patientId.toString(), status: 'ACTIVE', deletedAt: null},
        });

        return subscription === null ? null : this.mapper.toDomain(subscription);
    }

    async findRenewable(now: Date): Promise<PatientSubscription[]> {
        const subscriptions = await this.prisma.patientSubscription.findMany({
            where: {status: 'ACTIVE', currentPeriodEnd: {lte: now}, deletedAt: null},
        });

        return subscriptions.map((s) => this.mapper.toDomain(s));
    }

    async save(subscription: PatientSubscription): Promise<void> {
        const data = this.mapper.toPersistence(subscription);

        await this.prisma.patientSubscription.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
