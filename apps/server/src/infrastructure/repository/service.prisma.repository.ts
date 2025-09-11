import {Injectable} from '@nestjs/common';
import PrismaClient from '@prisma/client';
import {DuplicateNameException} from '../../domain/@shared/exceptions';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {Service, ServiceId} from '../../domain/service/entities';
import {DuplicateCodeException} from '../../domain/service/service.exception';
import {ServiceRepository, ServiceSearchFilter, ServiceSortOptions} from '../../domain/service/service.repository';
import {ServiceCategoryId} from '../../domain/service-category/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type ServiceModel = PrismaClient.Service;

@Injectable()
export class ServicePrismaRepository extends PrismaRepository implements ServiceRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(service: ServiceModel): Service {
        return new Service({
            ...service,
            id: ServiceId.from(service.id),
            companyId: CompanyId.from(service.companyId),
            categoryId: ServiceCategoryId.from(service.categoryId),
        });
    }

    private static denormalized(service: Service): ServiceModel {
        return {
            id: service.id.toString(),
            companyId: service.companyId.toString(),
            categoryId: service.categoryId.toString(),
            name: service.name,
            code: service.code,
            price: service.price,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
        };
    }

    async findById(id: ServiceId): Promise<Service | null> {
        const service = await this.prisma.service.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return service === null ? null : ServicePrismaRepository.normalize(service);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<ServiceSortOptions>,
        filter?: ServiceSearchFilter
    ): Promise<PaginatedList<Service>> {
        const where: PrismaClient.Prisma.ServiceWhereInput = {
            categoryId: filter?.categoryId?.toString(),
            companyId: companyId.toString(),
            name: {
                mode: 'insensitive',
                contains: filter?.name,
            },
            code: filter?.code,
            price: filter?.price,
        };

        const [services, totalCount] = await Promise.all([
            this.prisma.service.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.service.count({where}),
        ]);

        return {
            data: services.slice(0, pagination.limit).map((service) => ServicePrismaRepository.normalize(service)),
            totalCount,
            nextCursor: services.length > pagination.limit ? services[services.length - 1].id : null,
        };
    }

    async save(service: Service): Promise<void> {
        const serviceModel = ServicePrismaRepository.denormalized(service);

        try {
            await this.prisma.service.upsert({
                where: {
                    id: serviceModel.id,
                },
                update: serviceModel,
                create: serviceModel,
            });
        } catch (e) {
            if (this.checkUniqueViolation(e, 'name')) {
                throw new DuplicateNameException('Duplicate service name.');
            }

            if (this.checkUniqueViolation(e, 'code')) {
                throw new DuplicateCodeException('Duplicate service code.');
            }

            throw e;
        }
    }

    async delete(id: ServiceId): Promise<void> {
        await this.prisma.service.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
