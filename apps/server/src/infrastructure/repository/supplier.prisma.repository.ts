import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {DocumentId, Phone} from '../../domain/@shared/value-objects';
import {CompanyId} from '../../domain/company/entities';
import {Gender, PersonId, PersonProfile, PersonType} from '../../domain/person/entities';
import {DuplicateDocumentIdException} from '../../domain/person/person.exceptions';
import {Supplier} from '../../domain/supplier/entities';
import {SupplierRepository, SupplierSearchFilter, SupplierSortOptions} from '../../domain/supplier/supplier.repository';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type SupplierModel = PrismaClient.Supplier & {person: PrismaClient.Person};

@Injectable()
export class SupplierPrismaRepository extends PrismaRepository implements SupplierRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(supplier: SupplierModel): Supplier {
        return new Supplier({
            ...supplier,
            id: PersonId.from(supplier.id),
            companyId: CompanyId.from(supplier.person.companyId),
            documentId: DocumentId.create(supplier.person.documentId),
            name: supplier.person.name,
            companyName: supplier.person.companyName,
            gender: supplier.person.gender === null ? null : Gender[supplier.person.gender],
            phone: supplier.person.phone === null ? null : Phone.create(supplier.person.phone),
            profiles: new Set(supplier.person.profiles.map((profile) => PersonProfile[profile])),
            personType: PersonType[supplier.person.personType],
        });
    }

    private static denormalize(supplier: Supplier): SupplierModel {
        return {
            id: supplier.id.toString(),
            createdAt: supplier.createdAt,
            updatedAt: supplier.updatedAt,
            person: {
                id: supplier.id.toString(),
                companyId: supplier.companyId.toString(),
                documentId: supplier.documentId.toString(),
                name: supplier.name,
                companyName: supplier.companyName ?? null,
                gender: supplier.gender ?? null,
                profiles: [...supplier.profiles],
                personType: supplier.personType,
                phone: supplier.phone?.toString() ?? null,
                createdAt: supplier.createdAt,
                updatedAt: supplier.updatedAt,
            },
        };
    }

    async findById(id: PersonId): Promise<Supplier | null> {
        const supplier = await this.prisma.supplier.findUnique({
            where: {
                id: id.toString(),
            },
            include: {
                person: true,
            },
        });

        return supplier === null ? null : SupplierPrismaRepository.normalize(supplier);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<SupplierSortOptions>,
        filter: SupplierSearchFilter = {}
    ): Promise<PaginatedList<Supplier>> {
        const where: PrismaClient.Prisma.SupplierWhereInput = {
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

        const [suppliers, totalCount] = await Promise.all([
            this.prisma.supplier.findMany({
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
            this.prisma.supplier.count({where}),
        ]);

        return {
            data: suppliers.slice(0, pagination.limit).map((supplier) => SupplierPrismaRepository.normalize(supplier)),
            totalCount,
            nextCursor: suppliers.length > pagination.limit ? suppliers[suppliers.length - 1].id : null,
        };
    }

    async save(supplier: Supplier): Promise<void> {
        const {id, person, ...supplierModel} = SupplierPrismaRepository.denormalize(supplier);

        try {
            await this.prisma.person.upsert({
                where: {
                    id,
                },
                create: {
                    ...person,
                    supplier: {
                        connectOrCreate: {
                            where: {
                                id,
                            },
                            create: supplierModel,
                        },
                    },
                },
                update: {
                    ...person,
                    supplier: {
                        connectOrCreate: {
                            where: {
                                id,
                            },
                            create: supplierModel,
                        },
                        update: supplierModel,
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
        await this.prisma.supplier.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
