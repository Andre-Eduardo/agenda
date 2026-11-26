import {Injectable} from '@nestjs/common';
import type {ClinicId} from '@domain/clinic/entities';
import {RecordAmendment} from '@domain/record/entities/record-amendment.entity';
import {RecordId} from '@domain/record/entities/record.entity';
import {RecordAmendmentRepository, type RecordAmendmentEntry} from '@domain/record/record-amendment.repository';
import {RecordAmendmentMapper} from '@infrastructure/mappers/record-amendment.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class RecordAmendmentPrismaRepository extends PrismaRepository implements RecordAmendmentRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: RecordAmendmentMapper
    ) {
        super(prismaProvider);
    }

    async findAllByRecordId(recordId: RecordId, clinicId: ClinicId): Promise<RecordAmendmentEntry[]> {
        const amendments = await this.prisma.recordAmendment.findMany({
            where: {recordId: recordId.toString(), clinicId: clinicId.toString()},
            include: {requestedBy: {select: {clinicId: true, displayName: true, user: {select: {name: true}}}}},
            orderBy: [{reopenedAt: 'desc'}, {id: 'desc'}],
        });

        return amendments.map(({requestedBy, ...amendment}) => ({
            amendment: this.mapper.toDomain(amendment),
            requestedByName:
                requestedBy.clinicId === clinicId.toString()
                    ? (requestedBy.displayName ?? requestedBy.user.name)
                    : null,
        }));
    }

    async findLatestOpenByRecordId(recordId: RecordId, clinicId: ClinicId): Promise<RecordAmendment | null> {
        const amendment = await this.prisma.recordAmendment.findFirst({
            where: {recordId: recordId.toString(), clinicId: clinicId.toString(), relockedAt: null},
            orderBy: [{reopenedAt: 'desc'}, {id: 'desc'}],
        });

        return amendment === null ? null : this.mapper.toDomain(amendment);
    }

    async save(amendment: RecordAmendment): Promise<void> {
        const data = this.mapper.toPersistence(amendment);

        await this.prisma.recordAmendment.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
