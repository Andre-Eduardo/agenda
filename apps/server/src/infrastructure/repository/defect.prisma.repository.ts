import {Injectable} from '@nestjs/common';
import PrismaClient from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {DefectRepository, DefectSearchFilter, DefectSortOptions} from '../../domain/defect/defect.repository';
import {Defect, DefectId} from '../../domain/defect/entities';
import {DefectTypeId} from '../../domain/defect-type/entities';
import {RoomId} from '../../domain/room/entities';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type DefectModel = PrismaClient.Defect;

@Injectable()
export class DefectPrismaRepository extends PrismaRepository implements DefectRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(defect: DefectModel): Defect {
        return new Defect({
            ...defect,
            id: DefectId.from(defect.id),
            note: defect.note ?? null,
            companyId: CompanyId.from(defect.companyId),
            roomId: RoomId.from(defect.roomId),
            defectTypeId: DefectTypeId.from(defect.defectTypeId),
            createdById: UserId.from(defect.createdById),
            finishedById: defect.finishedById ? UserId.from(defect.finishedById) : null,
        });
    }

    private static denormalize(defect: Defect): DefectModel {
        return {
            id: defect.id.toString(),
            companyId: defect.companyId.toString(),
            note: defect.note,
            roomId: defect.roomId.toString(),
            defectTypeId: defect.defectTypeId.toString(),
            createdById: defect.createdById.toString(),
            finishedById: defect.finishedById?.toString() ?? null,
            finishedAt: defect.finishedAt ?? null,
            createdAt: defect.createdAt,
            updatedAt: defect.updatedAt,
        };
    }

    async findById(id: DefectId): Promise<Defect | null> {
        const defect = await this.prisma.defect.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return defect === null ? null : DefectPrismaRepository.normalize(defect);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<DefectSortOptions>,
        filter?: DefectSearchFilter
    ): Promise<PaginatedList<Defect>> {
        const where: PrismaClient.Prisma.DefectWhereInput = {
            companyId: companyId.toString(),
            id: {
                in: filter?.defectIds?.map((id) => id.toString()),
            },
            note: {
                mode: 'insensitive',
                contains: filter?.note,
            },
            roomId: filter?.roomId?.toString(),
            defectTypeId: filter?.defectTypeId?.toString(),
            createdById: filter?.createdById?.toString(),
            finishedById: filter?.finishedById?.toString(),
        };

        const [defects, totalCount] = await Promise.all([
            this.prisma.defect.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.defect.count({where}),
        ]);

        return {
            data: defects.slice(0, pagination.limit).map((defect) => DefectPrismaRepository.normalize(defect)),
            totalCount,
            nextCursor: defects.length > pagination.limit ? defects[defects.length - 1].id : null,
        };
    }

    async save(defect: Defect): Promise<void> {
        const defectModel = DefectPrismaRepository.denormalize(defect);

        await this.prisma.defect.upsert({
            where: {
                id: defectModel.id,
            },
            update: defectModel,
            create: defectModel,
        });
    }

    async delete(id: DefectId): Promise<void> {
        await this.prisma.defect.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
