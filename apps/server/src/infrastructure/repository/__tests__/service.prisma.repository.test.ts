import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import {DuplicateNameException} from '../../../domain/@shared/exceptions';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import type {Service} from '../../../domain/service/entities';
import {fakeService} from '../../../domain/service/entities/__tests__/fake-service';
import {DuplicateCodeException} from '../../../domain/service/service.exception';
import type {ServiceSortOptions} from '../../../domain/service/service.repository';
import {ServiceCategoryId} from '../../../domain/service-category/entities';
import type {PrismaService} from '../prisma';
import type {ServiceModel} from '../service.prisma.repository';
import {ServicePrismaRepository} from '../service.prisma.repository';

describe('A service repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new ServicePrismaRepository(prisma);

    const companyId = CompanyId.generate();

    const domainServices: Service[] = [fakeService({name: 'Special decorating'}), fakeService({name: 'Foot spa'})];

    const databaseServices: ServiceModel[] = [
        {
            id: domainServices[0].id.toString(),
            companyId: domainServices[0].companyId.toString(),
            categoryId: domainServices[0].categoryId.toString(),
            name: domainServices[0].name,
            code: domainServices[0].code,
            price: domainServices[0].price,
            createdAt: domainServices[0].createdAt,
            updatedAt: domainServices[0].updatedAt,
        },
        {
            id: domainServices[1].id.toString(),
            companyId: domainServices[1].companyId.toString(),
            categoryId: domainServices[1].categoryId.toString(),
            name: domainServices[1].name,
            code: domainServices[1].code,
            price: domainServices[1].price,
            createdAt: domainServices[1].createdAt,
            updatedAt: domainServices[1].updatedAt,
        },
    ];

    describe('A service repository backed by Prisma ORM', () => {
        it.each([
            [null, null],
            [databaseServices[0], domainServices[0]],
        ])('should find a service by ID', async (databaseService, domainService) => {
            jest.spyOn(prisma.service, 'findUnique').mockResolvedValueOnce(databaseService);

            await expect(repository.findById(domainServices[0].id)).resolves.toEqual(domainService);

            expect(prisma.service.findUnique).toHaveBeenCalledTimes(1);
            expect(prisma.service.findUnique).toHaveBeenCalledWith({
                where: {
                    id: domainServices[0].id.toString(),
                },
            });
        });

        it('should search services', async () => {
            const pagination: Pagination<ServiceSortOptions> = {
                limit: 10,
                sort: {
                    createdAt: 'desc',
                },
            };

            const filter = {
                name: 'Service',
                code: undefined,
                price: undefined,
            };

            jest.spyOn(prisma.service, 'findMany').mockResolvedValueOnce(databaseServices);
            jest.spyOn(prisma.service, 'count').mockResolvedValueOnce(databaseServices.length);

            await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
                data: domainServices,
                totalCount: databaseServices.length,
                nextCursor: null,
            });

            expect(prisma.service.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.service.findMany).toHaveBeenCalledWith({
                where: {
                    companyId: companyId.toString(),
                    name: {
                        mode: 'insensitive',
                        contains: filter.name,
                    },
                    code: undefined,
                    price: undefined,
                },
                take: pagination.limit + 1,
                orderBy: [
                    {
                        createdAt: 'desc',
                    },
                    {
                        id: 'asc',
                    },
                ],
            });
        });

        it('should paginate services', async () => {
            const pagination: Pagination<ServiceSortOptions> = {
                limit: 1,
                cursor: 'some-cursor',
                sort: {},
            };

            const filter = {
                name: 'Service',
                code: undefined,
                price: undefined,
                categoryId: ServiceCategoryId.generate(),
            };

            jest.spyOn(prisma.service, 'findMany').mockResolvedValueOnce(
                databaseServices.slice(0, pagination.limit + 1)
            );
            jest.spyOn(prisma.service, 'count').mockResolvedValueOnce(databaseServices.length);

            const result = await repository.search(companyId, pagination, filter);

            expect(result).toEqual({
                data: [domainServices[0]],
                totalCount: databaseServices.length,
                nextCursor: databaseServices[1].id,
            });

            expect(prisma.service.findMany).toHaveBeenCalledWith({
                where: {
                    categoryId: filter.categoryId.toString(),
                    companyId: companyId.toString(),
                    name: {
                        mode: 'insensitive',
                        contains: filter.name,
                    },
                    code: undefined,
                    price: undefined,
                },
                cursor: {
                    id: pagination.cursor,
                },
                take: 2,
                orderBy: [{id: 'asc'}],
            });
        });

        it('should save a service', async () => {
            jest.spyOn(prisma.service, 'upsert');

            await repository.save(domainServices[1]);

            expect(prisma.service.upsert).toHaveBeenCalledTimes(1);
            expect(prisma.service.upsert).toHaveBeenCalledWith({
                where: {
                    id: domainServices[1].id.toString(),
                },
                update: databaseServices[1],
                create: databaseServices[1],
            });
        });

        it('should delete a service by ID', async () => {
            jest.spyOn(prisma.service, 'delete');

            await repository.delete(domainServices[0].id);

            expect(prisma.service.delete).toHaveBeenCalledTimes(1);
            expect(prisma.service.delete).toHaveBeenCalledWith({
                where: {
                    id: domainServices[0].id.toString(),
                },
            });
        });

        it('should throw an exception when saving a service with a duplicate name', async () => {
            jest.spyOn(prisma.service, 'upsert').mockRejectedValueOnce(
                new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                    clientVersion: '0.0.0',
                    code: 'P2002',
                    meta: {
                        target: ['name'],
                    },
                })
            );

            await expect(repository.save(domainServices[0])).rejects.toThrowWithMessage(
                DuplicateNameException,
                'Duplicate service name.'
            );
        });

        it('should throw an exception when saving a service with a duplicate code', async () => {
            jest.spyOn(prisma.service, 'upsert').mockRejectedValueOnce(
                new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                    clientVersion: '0.0.0',
                    code: 'P2002',
                    meta: {
                        target: ['code'],
                    },
                })
            );

            await expect(repository.save(domainServices[0])).rejects.toThrowWithMessage(
                DuplicateCodeException,
                'Duplicate service code.'
            );
        });

        it('should rethrow an unknown error when saving a service', async () => {
            const error = new Error('Unknown error');

            jest.spyOn(prisma.service, 'upsert').mockRejectedValueOnce(error);

            await expect(repository.save(domainServices[0])).rejects.toThrow(error);
        });
    });
});
