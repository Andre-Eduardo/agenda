import {Injectable} from '@nestjs/common';
import PrismaClient from '@prisma/client';
import {DuplicateNameException} from '../../domain/@shared/exceptions';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {
    DefectTypeRepository,
    DefectTypeSearchFilter,
    DefectTypeSortOptions,
} from '../../domain/defect-type/defect-type.repository';
import {DefectType, DefectTypeId} from '../../domain/defect-type/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type DefectTypeModel = PrismaClient.DefectType;

@Injectable()
export class DefectTypePrismaRepository extends PrismaRepository implements DefectTypeRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(defectType: DefectTypeModel): DefectType {
        return new DefectType({
            ...defectType,
            id: DefectTypeId.from(defectType.id),
            companyId: CompanyId.from(defectType.companyId),
        });
    }

    private static denormalize(defectType: DefectType): DefectTypeModel {
        return {
            id: defectType.id.toString(),
            companyId: defectType.companyId.toString(),
            name: defectType.name,
            createdAt: defectType.createdAt,
            updatedAt: defectType.updatedAt,
        };
    }

    async findById(id: DefectTypeId): Promise<DefectType | null> {
        const defectType = await this.prisma.defectType.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return defectType === null ? null : DefectTypePrismaRepository.normalize(defectType);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<DefectTypeSortOptions>,
        filter?: DefectTypeSearchFilter
    ): Promise<PaginatedList<DefectType>> {
        const where: PrismaClient.Prisma.DefectTypeWhereInput = {
            companyId: companyId.toString(),
            name: {
                mode: 'insensitive',
                contains: filter?.name,
            },
        };

        const [defectTypes, totalCount] = await Promise.all([
            this.prisma.defectType.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.defectType.count({where}),
        ]);

        return {
            data: defectTypes
                .slice(0, pagination.limit)
                .map((defectType) => DefectTypePrismaRepository.normalize(defectType)),
            totalCount,
            nextCursor: defectTypes.length > pagination.limit ? defectTypes[defectTypes.length - 1].id : null,
        };
    }

    async save(defectType: DefectType): Promise<void> {
        const defectTypeModel = DefectTypePrismaRepository.denormalize(defectType);

        try {
            await this.prisma.defectType.upsert({
                where: {
                    id: defectTypeModel.id,
                },
                update: defectTypeModel,
                create: defectTypeModel,
            });
        } catch (e) {
            if (this.checkUniqueViolation(e, 'name')) {
                throw new DuplicateNameException('Duplicate defect type name.');
            }

            throw e;
        }
    }

    async delete(id: DefectTypeId): Promise<void> {
        await this.prisma.defectType.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
