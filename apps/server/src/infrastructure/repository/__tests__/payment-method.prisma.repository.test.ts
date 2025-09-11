import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import type {PaymentMethod} from '../../../domain/payment-method/entities';
import {PaymentMethodType} from '../../../domain/payment-method/entities';
import {fakePaymentMethod} from '../../../domain/payment-method/entities/__tests__/fake-payment-method';
import type {
    PaymentMethodSearchFilter,
    PaymentMethodSortOptions,
} from '../../../domain/payment-method/payment-method.repository';
import type {PaymentMethodModel} from '../index';
import {PaymentMethodPrismaRepository} from '../index';
import type {PrismaService} from '../prisma';

describe('A payment method repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new PaymentMethodPrismaRepository(prisma);

    const companyId = CompanyId.generate();
    const domainPaymentMethods: PaymentMethod[] = [
        fakePaymentMethod({
            name: 'Payment Method',
            type: PaymentMethodType.CASH,
            companyId,
        }),
        fakePaymentMethod({
            name: 'Payment Method 2',
            type: PaymentMethodType.CREDIT_CARD,
            companyId,
        }),
        fakePaymentMethod({
            name: 'Payment Method 3',
            type: PaymentMethodType.OTHER,
            companyId,
        }),
    ];

    const databasePaymentMethods: PaymentMethodModel[] = [
        {
            id: domainPaymentMethods[0].id.toString(),
            name: domainPaymentMethods[0].name,
            type: domainPaymentMethods[0].type,
            companyId: domainPaymentMethods[0].companyId.toString(),
            createdAt: domainPaymentMethods[0].createdAt,
            updatedAt: domainPaymentMethods[0].updatedAt,
        },
        {
            id: domainPaymentMethods[1].id.toString(),
            name: domainPaymentMethods[1].name,
            type: domainPaymentMethods[1].type,
            companyId: domainPaymentMethods[1].companyId.toString(),
            createdAt: domainPaymentMethods[1].createdAt,
            updatedAt: domainPaymentMethods[1].updatedAt,
        },
        {
            id: domainPaymentMethods[2].id.toString(),
            name: domainPaymentMethods[2].name,
            type: domainPaymentMethods[2].type,
            companyId: domainPaymentMethods[2].companyId.toString(),
            createdAt: domainPaymentMethods[2].createdAt,
            updatedAt: domainPaymentMethods[2].updatedAt,
        },
    ];

    it.each([
        [null, null],
        [databasePaymentMethods[0], domainPaymentMethods[0]],
    ])('should find a payment method by ID', async (databasePaymentMethod, domainPaymentMethod) => {
        jest.spyOn(prisma.paymentMethod, 'findUnique').mockResolvedValueOnce(databasePaymentMethod);

        const result = await repository.findById(domainPaymentMethods[0].id);

        expect(result).toEqual(domainPaymentMethod);
        expect(prisma.paymentMethod.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.paymentMethod.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainPaymentMethods[0].id.toString(),
            },
        });
    });

    it('should save a payment method', async () => {
        jest.spyOn(prisma.paymentMethod, 'upsert');

        await repository.save(domainPaymentMethods[2]);

        expect(prisma.paymentMethod.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.paymentMethod.upsert).toHaveBeenCalledWith({
            where: {
                id: domainPaymentMethods[2].id.toString(),
            },
            create: databasePaymentMethods[2],
            update: databasePaymentMethods[2],
        });
    });

    it('should rethrow an unknown error when saving a payment method', async () => {
        jest.spyOn(prisma.paymentMethod, 'upsert').mockRejectedValue(new Error('Generic error'));
        await expect(repository.save(domainPaymentMethods[1])).rejects.toThrowWithMessage(Error, 'Generic error');
    });

    it('should delete a payment method by ID', async () => {
        jest.spyOn(prisma.paymentMethod, 'delete');

        await repository.delete(domainPaymentMethods[0].id);

        expect(prisma.paymentMethod.delete).toHaveBeenCalledTimes(1);
        expect(prisma.paymentMethod.delete).toHaveBeenCalledWith({
            where: {
                id: domainPaymentMethods[0].id.toString(),
            },
        });
    });

    it('should search payment methods', async () => {
        const pagination: Pagination<PaymentMethodSortOptions> = {
            limit: 5,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: PaymentMethodSearchFilter = {
            name: 'Payment Method',
            type: PaymentMethodType.CASH,
        };

        jest.spyOn(prisma.paymentMethod, 'findMany').mockResolvedValueOnce(databasePaymentMethods);
        jest.spyOn(prisma.paymentMethod, 'count').mockResolvedValueOnce(databasePaymentMethods.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainPaymentMethods,
            totalCount: databasePaymentMethods.length,
            nextCursor: null,
        });

        expect(prisma.paymentMethod.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.paymentMethod.findMany).toHaveBeenCalledWith({
            where: {
                name: {contains: filter.name, mode: 'insensitive'},
                type: 'CASH',
                companyId: companyId.toString(),
            },
            take: 6,
            orderBy: [
                {
                    createdAt: 'desc',
                },
                {
                    id: 'asc',
                },
            ],
        });

        expect(prisma.paymentMethod.count).toHaveBeenCalledTimes(1);
        expect(prisma.paymentMethod.count).toHaveBeenCalledWith({
            where: {
                name: {contains: filter.name, mode: 'insensitive'},
                type: 'CASH',
                companyId: companyId.toString(),
            },
        });
    });

    it('should paginate payment methods', async () => {
        const pagination: Pagination<PaymentMethodSortOptions> = {
            limit: 1,
            sort: {},
        };

        jest.spyOn(prisma.paymentMethod, 'findMany').mockResolvedValueOnce(
            databasePaymentMethods.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.paymentMethod, 'count').mockResolvedValueOnce(databasePaymentMethods.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainPaymentMethods[0]],
            totalCount: databasePaymentMethods.length,
            nextCursor: databasePaymentMethods[1].id,
        });

        expect(prisma.paymentMethod.findMany).toHaveBeenCalledWith({
            where: {
                name: {contains: undefined, mode: 'insensitive'},
                type: undefined,
                companyId: companyId.toString(),
            },
            take: 2,
            orderBy: [
                {
                    id: 'asc',
                },
            ],
        });

        jest.spyOn(prisma.paymentMethod, 'findMany').mockResolvedValueOnce(
            databasePaymentMethods.slice(1, pagination.limit + 2)
        );
        jest.spyOn(prisma.paymentMethod, 'count').mockResolvedValueOnce(databasePaymentMethods.length);

        await expect(
            repository.search(companyId, {
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: [domainPaymentMethods[1]],
            totalCount: databasePaymentMethods.length,
            nextCursor: databasePaymentMethods[2].id,
        });

        expect(prisma.paymentMethod.findMany).toHaveBeenCalledWith({
            where: {
                name: {contains: undefined, mode: 'insensitive'},
                type: undefined,
                companyId: companyId.toString(),
            },
            take: 2,
            orderBy: [
                {
                    id: 'asc',
                },
            ],
        });
    });
});
