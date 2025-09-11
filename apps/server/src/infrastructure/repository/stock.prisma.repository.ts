import {Injectable} from '@nestjs/common';
import PrismaClient from '@prisma/client';
import {DuplicateNameException} from '../../domain/@shared/exceptions';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {RoomId} from '../../domain/room/entities';
import {Stock, StockId, StockType} from '../../domain/stock/entities';
import {DuplicateRoomException, StockWithChildrenException} from '../../domain/stock/stock.exceptions';
import {StockRepository, StockSearchFilter, StockSortOptions} from '../../domain/stock/stock.repository';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type StockModel = PrismaClient.Stock;

@Injectable()
export class StockPrismaRepository extends PrismaRepository implements StockRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(stock: StockModel): Stock {
        return new Stock({
            ...stock,
            id: StockId.from(stock.id),
            companyId: CompanyId.from(stock.companyId),
            roomId: stock.roomId ? RoomId.from(stock.roomId) : null,
            parentId: stock.parentId ? StockId.from(stock.parentId) : null,
            name: stock.name ?? null,
            type: StockType[stock.type],
        });
    }

    private static denormalize(stock: Stock): StockModel {
        return {
            id: stock.id.toString(),
            companyId: stock.companyId.toString(),
            name: stock.name,
            type: stock.type,
            roomId: stock.roomId ? stock.roomId.toString() : null,
            parentId: stock.parentId ? stock.parentId.toString() : null,
            createdAt: stock.createdAt,
            updatedAt: stock.updatedAt,
        };
    }

    async findById(id: StockId): Promise<Stock | null> {
        const stock = await this.prisma.stock.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return stock === null ? null : StockPrismaRepository.normalize(stock);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<StockSortOptions>,
        filter: StockSearchFilter
    ): Promise<PaginatedList<Stock>> {
        const where: PrismaClient.Prisma.StockWhereInput = {
            companyId: companyId.toString(),
            name: {
                mode: 'insensitive',
                contains: filter.name,
            },
            roomId: filter.roomId?.toString(),
            type: filter.type,
        };

        const [stocks, totalCount] = await Promise.all([
            this.prisma.stock.findMany({
                where,
                ...(pagination.cursor && {cursor: {id: pagination.cursor}}),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.stock.count({where}),
        ]);

        return {
            data: stocks.slice(0, pagination.limit).map((stock) => StockPrismaRepository.normalize(stock)),
            totalCount,
            nextCursor: stocks.length > pagination.limit ? stocks[stocks.length - 1].id.toString() : null,
        };
    }

    async save(stock: Stock): Promise<void> {
        const stockModel = StockPrismaRepository.denormalize(stock);

        try {
            await this.prisma.stock.upsert({
                where: {
                    id: stockModel.id,
                },
                update: stockModel,
                create: stockModel,
            });
        } catch (e) {
            if (this.checkUniqueViolation(e, 'name')) {
                throw new DuplicateNameException('Duplicate stock name.');
            }

            if (this.checkUniqueViolation(e, 'roomId')) {
                throw new DuplicateRoomException('Duplicate stock room.');
            }

            throw e;
        }
    }

    async delete(stockId: StockId): Promise<void> {
        try {
            await this.prisma.stock.delete({
                where: {
                    id: stockId.toString(),
                },
            });
        } catch (e) {
            if (this.checkForeignKeyViolation(e, 'stock_parent_id_fkey')) {
                throw new StockWithChildrenException('Stock has children.');
            }

            throw e;
        }
    }
}
