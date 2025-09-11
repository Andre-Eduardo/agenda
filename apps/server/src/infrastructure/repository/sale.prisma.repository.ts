import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import {CompanyId} from '../../domain/company/entities';
import {ProductId} from '../../domain/product/entities';
import {Sale, SaleId, SaleItem, SaleItemId} from '../../domain/sale/entities';
import {SaleRepository} from '../../domain/sale/sale.repository';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

const saleSelect = Prisma.validator<Prisma.SaleDefaultArgs>()({
    include: {
        items: true,
    },
});

export type SaleModel = Prisma.SaleGetPayload<typeof saleSelect>;
export type SaleItemModel = PrismaClient.SaleItem;

@Injectable()
export class SalePrismaRepository extends PrismaRepository implements SaleRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    static normalizeItem(saleItem: SaleItemModel): SaleItem {
        return new SaleItem({
            ...saleItem,
            id: SaleItemId.from(saleItem.id),
            saleId: SaleId.from(saleItem.saleId),
            productId: ProductId.from(saleItem.productId),
            canceledBy: saleItem.canceledById ? UserId.from(saleItem.canceledById) : null,
        });
    }

    static denormalizeItem(saleItem: SaleItem): SaleItemModel {
        return {
            id: saleItem.id.toString(),
            saleId: saleItem.saleId.toString(),
            productId: saleItem.productId.toString(),
            price: saleItem.price,
            quantity: saleItem.quantity,
            note: saleItem.note,
            canceledAt: saleItem.canceledAt,
            canceledById: saleItem.canceledBy?.toString() ?? null,
            canceledReason: saleItem.canceledReason,
            createdAt: saleItem.createdAt,
            updatedAt: saleItem.updatedAt,
        };
    }

    private static normalize(sale: SaleModel): Sale {
        return new Sale({
            ...sale,
            id: SaleId.from(sale.id),
            companyId: CompanyId.from(sale.companyId),
            sellerId: UserId.from(sale.sellerId),
            items: sale.items.map((saleItem) => this.normalizeItem(saleItem)),
        });
    }

    async findById(id: SaleId): Promise<Sale | null> {
        const sale = await this.prisma.sale.findUnique({
            where: {
                id: id.toString(),
            },
            ...saleSelect,
        });

        return sale === null ? null : SalePrismaRepository.normalize(sale);
    }
}
