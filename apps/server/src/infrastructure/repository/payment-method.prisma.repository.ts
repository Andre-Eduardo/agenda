import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {PaymentMethod, PaymentMethodId, PaymentMethodType} from '../../domain/payment-method/entities';
import {
    PaymentMethodRepository,
    PaymentMethodSearchFilter,
    PaymentMethodSortOptions,
} from '../../domain/payment-method/payment-method.repository';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type PaymentMethodModel = PrismaClient.PaymentMethod;

@Injectable()
export class PaymentMethodPrismaRepository extends PrismaRepository implements PaymentMethodRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(paymentMethod: PaymentMethodModel): PaymentMethod {
        return new PaymentMethod({
            id: PaymentMethodId.from(paymentMethod.id),
            name: paymentMethod.name,
            type: PaymentMethodType[paymentMethod.type],
            companyId: CompanyId.from(paymentMethod.companyId),
            createdAt: paymentMethod.createdAt,
            updatedAt: paymentMethod.updatedAt,
        });
    }

    private static denormalize(paymentMethod: PaymentMethod): PaymentMethodModel {
        return {
            id: paymentMethod.id.toString(),
            name: paymentMethod.name,
            type: paymentMethod.type,
            companyId: paymentMethod.companyId.toString(),
            createdAt: paymentMethod.createdAt,
            updatedAt: paymentMethod.updatedAt,
        };
    }

    async findById(id: PaymentMethodId): Promise<PaymentMethod | null> {
        const paymentMethod = await this.prisma.paymentMethod.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return paymentMethod === null ? null : PaymentMethodPrismaRepository.normalize(paymentMethod);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<PaymentMethodSortOptions>,
        filter: PaymentMethodSearchFilter = {}
    ): Promise<PaginatedList<PaymentMethod>> {
        const where: PrismaClient.Prisma.PaymentMethodWhereInput = {
            name: {
                mode: 'insensitive',
                contains: filter.name,
            },
            type: filter.type,
            companyId: companyId.toString(),
        };

        const [paymentMethods, totalCount] = await Promise.all([
            this.prisma.paymentMethod.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.paymentMethod.count({where}),
        ]);

        return {
            data: paymentMethods
                .slice(0, pagination.limit)
                .map((paymentMethod) => PaymentMethodPrismaRepository.normalize(paymentMethod)),
            totalCount,
            nextCursor: paymentMethods.length > pagination.limit ? paymentMethods[paymentMethods.length - 1].id : null,
        };
    }

    async save(paymentMethod: PaymentMethod): Promise<void> {
        const paymentMethodModel = PaymentMethodPrismaRepository.denormalize(paymentMethod);

        await this.prisma.paymentMethod.upsert({
            where: {
                id: paymentMethodModel.id,
            },
            create: paymentMethodModel,
            update: paymentMethodModel,
        });
    }

    async delete(id: PaymentMethodId): Promise<void> {
        await this.prisma.paymentMethod.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
