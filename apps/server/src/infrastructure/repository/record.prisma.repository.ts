import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PaginatedList, Pagination} from '@domain/@shared/repository';
import {toEnumOrNull} from '@domain/@shared/utils';
import {Record, RecordId} from '@domain/record/entities/record.entity';
import {RecordRepository, RecordSearchFilter, RecordSortOptions} from '@domain/record/record.repository';
import {RecordMapper} from '@infrastructure/mappers/record.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

// Define a type that includes the relation
type RecordWithFiles = PrismaClient.Record & {
    files: PrismaClient.File[];
};

@Injectable()
export class RecordPrismaRepository extends PrismaRepository implements RecordRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: RecordMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: RecordId): Promise<Record | null> {
        const record = await this.prisma.record.findFirst({
            where: {
                id: id.toString(),
                deletedAt: null,
                patient: {deletedAt: null},
            },
            include: {
                files: true,
            },
        });

        return record === null ? null : this.mapper.toDomain(record);
    }

    /** Soft delete: the clinical record is retained, only hidden from every read. */
    async delete(id: RecordId): Promise<void> {
        await this.prisma.record.updateMany({
            where: {id: id.toString(), deletedAt: null},
            data: this.softDeleteData(),
        });
    }

    async search(
        pagination: Pagination<RecordSortOptions>,
        filter: RecordSearchFilter = {}
    ): Promise<PaginatedList<Record>> {
        const patientIds = filter.patientIds?.map((id) => id.toString());
        const accessScope: PrismaClient.Prisma.RecordWhereInput | undefined = filter.accessPatientIds
            ? {
                  OR: [
                      {patientId: {in: filter.accessPatientIds.map((id) => id.toString())}},
                      {id: {in: (filter.allowedRecordIds ?? []).map((id) => id.toString())}},
                  ],
              }
            : undefined;
        const deniedScope: PrismaClient.Prisma.RecordWhereInput | undefined = filter.deniedRecordIds?.length
            ? {id: {notIn: filter.deniedRecordIds.map((id) => id.toString())}}
            : undefined;
        const where: PrismaClient.Prisma.RecordWhereInput = {
            AND: [accessScope, deniedScope].filter((scope) => scope !== undefined),
            id: filter.ids ? {in: filter.ids.map((id) => id.toString())} : undefined,
            description: filter.term ? {contains: filter.term, mode: 'insensitive'} : undefined,
            clinicId: filter.clinicId ? filter.clinicId.toString() : undefined,
            patientId: filter.patientId?.toString() ?? (patientIds ? {in: patientIds} : undefined),
            createdByMemberId: filter.createdByMemberId ? filter.createdByMemberId.toString() : undefined,
            responsibleProfessionalId: filter.responsibleProfessionalId
                ? filter.responsibleProfessionalId.toString()
                : undefined,
            appointmentId: filter.appointmentId ? filter.appointmentId.toString() : undefined,
            attendanceType: toEnumOrNull(PrismaClient.AttendanceType, filter.attendanceType) ?? undefined,
            clinicalStatus: toEnumOrNull(PrismaClient.ClinicalStatusTag, filter.clinicalStatus) ?? undefined,
            source: toEnumOrNull(PrismaClient.RecordSource, filter.source) ?? undefined,
            eventDate:
                filter.dateStart || filter.dateEnd
                    ? {
                          gte: filter.dateStart,
                          lte: filter.dateEnd,
                      }
                    : undefined,
            deletedAt: null,
            patient: {deletedAt: null},
        };

        const [data, totalCount] = await Promise.all([
            this.prisma.record.findMany({
                where,
                include: {files: true},
                ...this.normalizePagination(pagination, {createdAt: 'desc'}),
            }),
            this.prisma.record.count({where}),
        ]);

        return {
            data: data.map((item) => this.mapper.toDomain(item as RecordWithFiles)),
            totalCount,
        };
    }

    async save(record: Record): Promise<void> {
        const data = this.mapper.toPersistence(record);
        const {files, ...recordData} = data;

        await this.prisma.record.upsert({
            where: {id: recordData.id},
            create: recordData,
            update: recordData,
        });
    }
}
