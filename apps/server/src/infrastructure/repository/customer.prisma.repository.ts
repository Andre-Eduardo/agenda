import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {DocumentId, Phone} from '../../domain/@shared/value-objects';
import {CompanyId} from '../../domain/company/entities';
import {CustomerRepository, CustomerSearchFilter, CustomerSortOptions} from '../../domain/customer/customer.repository';
import {Customer} from '../../domain/customer/entities';
import {Gender, PersonId, PersonProfile, PersonType} from '../../domain/person/entities';
import {DuplicateDocumentIdException} from '../../domain/person/person.exceptions';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type CustomerModel = PrismaClient.Customer & {person: PrismaClient.Person};

@Injectable()
export class CustomerPrismaRepository extends PrismaRepository implements CustomerRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(customer: CustomerModel): Customer {
        return new Customer({
            ...customer,
            id: PersonId.from(customer.id),
            companyId: CompanyId.from(customer.person.companyId),
            documentId: DocumentId.create(customer.person.documentId),
            name: customer.person.name,
            companyName: customer.person.companyName,
            gender: customer.person.gender === null ? null : Gender[customer.person.gender],
            phone: customer.person.phone === null ? null : Phone.create(customer.person.phone),
            profiles: new Set(customer.person.profiles.map((profile) => PersonProfile[profile])),
            personType: PersonType[customer.person.personType],
        });
    }

    private static denormalize(customer: Customer): CustomerModel {
        return {
            id: customer.id.toString(),
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt,
            person: {
                id: customer.id.toString(),
                companyId: customer.companyId.toString(),
                documentId: customer.documentId.toString(),
                name: customer.name,
                companyName: customer.companyName ?? null,
                gender: customer.gender ?? null,
                profiles: [...customer.profiles],
                personType: customer.personType,
                phone: customer.phone?.toString() ?? null,
                createdAt: customer.createdAt,
                updatedAt: customer.updatedAt,
            },
        };
    }

    async findById(id: PersonId): Promise<Customer | null> {
        const customer = await this.prisma.customer.findUnique({
            where: {
                id: id.toString(),
            },
            include: {
                person: true,
            },
        });

        return customer === null ? null : CustomerPrismaRepository.normalize(customer);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<CustomerSortOptions>,
        filter: CustomerSearchFilter = {}
    ): Promise<PaginatedList<Customer>> {
        const where: PrismaClient.Prisma.CustomerWhereInput = {
            person: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
                companyName: {
                    mode: 'insensitive',
                    contains: filter.companyName,
                },
                documentId: {contains: filter.documentId?.toString()},
                phone: {contains: filter.phone?.toString()},
                personType: filter.personType,
                profiles: filter.profiles && {
                    hasSome: filter.profiles,
                },
                gender: filter.gender,
            },
        };

        const {createdAt, updatedAt, ...personSort} = pagination.sort;

        const [customers, totalCount] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                include: {
                    person: true,
                },
                take: pagination.limit + 1,
                orderBy: [
                    ...this.normalizeSort({createdAt, updatedAt}),
                    ...this.normalizeSort(personSort).map((sort) => ({person: sort})),
                    {id: 'asc'},
                ],
            }),
            this.prisma.customer.count({where}),
        ]);

        return {
            data: customers.slice(0, pagination.limit).map((customer) => CustomerPrismaRepository.normalize(customer)),
            totalCount,
            nextCursor: customers.length > pagination.limit ? customers[customers.length - 1].id : null,
        };
    }

    async save(customer: Customer): Promise<void> {
        const {id, person, ...customerModel} = CustomerPrismaRepository.denormalize(customer);

        try {
            await this.prisma.person.upsert({
                where: {
                    id,
                },
                create: {
                    ...person,
                    customer: {
                        connectOrCreate: {
                            where: {
                                id,
                            },
                            create: customerModel,
                        },
                    },
                },
                update: {
                    ...person,
                    customer: {
                        connectOrCreate: {
                            where: {
                                id,
                            },
                            create: customerModel,
                        },
                        update: customerModel,
                    },
                },
            });
        } catch (e) {
            if (this.checkUniqueViolation(e, 'document_id')) {
                throw new DuplicateDocumentIdException('Duplicate person document ID.');
            }

            throw e;
        }
    }

    async delete(id: PersonId): Promise<void> {
        await this.prisma.customer.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
