import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import {DuplicateNameException} from '../../domain/@shared/exceptions';
import type {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {RoomCategory, RoomCategoryId} from '../../domain/room-category/entities';
import {DuplicateAcronymException} from '../../domain/room-category/room-category.exceptions';
import {
    CategorySearchFilter,
    RoomCategoryRepository,
    RoomCategorySortOptions,
} from '../../domain/room-category/room-category.repository';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type RoomCategoryModel = PrismaClient.RoomCategory;

@Injectable()
export class RoomCategoryPrismaRepository extends PrismaRepository implements RoomCategoryRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(roomCategory: RoomCategoryModel): RoomCategory {
        return new RoomCategory({
            ...roomCategory,
            id: RoomCategoryId.from(roomCategory.id),
            companyId: CompanyId.from(roomCategory.companyId),
        });
    }

    private static denormalize(roomCategory: RoomCategory): RoomCategoryModel {
        return {
            id: roomCategory.id.toString(),
            companyId: roomCategory.companyId.toString(),
            name: roomCategory.name,
            acronym: roomCategory.acronym,
            guestCount: roomCategory.guestCount,
            createdAt: roomCategory.createdAt,
            updatedAt: roomCategory.updatedAt,
        };
    }

    async findById(id: RoomCategoryId): Promise<RoomCategory | null> {
        const roomCategory = await this.prisma.roomCategory.findUnique({
            where: {id: id.toString()},
        });

        return roomCategory === null ? null : RoomCategoryPrismaRepository.normalize(roomCategory);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<RoomCategorySortOptions>,
        filter?: CategorySearchFilter
    ): Promise<PaginatedList<RoomCategory>> {
        const where: Prisma.RoomCategoryWhereInput = {
            companyId: companyId.toString(),
            name: {
                mode: 'insensitive',
                contains: filter?.name,
            },
            acronym: {
                mode: 'insensitive',
                contains: filter?.acronym,
            },
        };

        const [categories, totalCount] = await Promise.all([
            this.prisma.roomCategory.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.roomCategory.count({where}),
        ]);

        return {
            data: categories
                .slice(0, pagination.limit)
                .map((roomCategory) => RoomCategoryPrismaRepository.normalize(roomCategory)),
            totalCount,
            nextCursor: categories.length > pagination.limit ? categories[categories.length - 1].id : null,
        };
    }

    async save(roomCategory: RoomCategory): Promise<void> {
        const roomCategoryModel = RoomCategoryPrismaRepository.denormalize(roomCategory);

        try {
            await this.prisma.roomCategory.upsert({
                where: {
                    id: roomCategoryModel.id,
                },
                create: roomCategoryModel,
                update: roomCategoryModel,
            });
        } catch (e) {
            if (this.checkUniqueViolation(e, 'name')) {
                throw new DuplicateNameException('Duplicate room category name.');
            }

            if (this.checkUniqueViolation(e, 'acronym')) {
                throw new DuplicateAcronymException('Duplicate room category acronym.');
            }

            throw e;
        }
    }

    async delete(id: RoomCategoryId): Promise<void> {
        await this.prisma.roomCategory.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
