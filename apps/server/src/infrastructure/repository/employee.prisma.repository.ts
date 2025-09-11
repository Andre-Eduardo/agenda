import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {DocumentId, Phone} from '../../domain/@shared/value-objects';
import {CompanyId} from '../../domain/company/entities';
import {EmployeeRepository, EmployeeSearchFilter, EmployeeSortOptions} from '../../domain/employee/employee.repository';
import {Employee} from '../../domain/employee/entities';
import {EmployeePositionId} from '../../domain/employee-position/entities';
import {Gender, PersonId, PersonProfile, PersonType} from '../../domain/person/entities';
import {DuplicateDocumentIdException} from '../../domain/person/person.exceptions';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type EmployeeModel = PrismaClient.Employee & {person: PrismaClient.Person};

@Injectable()
export class EmployeePrismaRepository extends PrismaRepository implements EmployeeRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(employee: EmployeeModel): Employee {
        return new Employee({
            ...employee,
            id: PersonId.from(employee.id),
            companyId: CompanyId.from(employee.person.companyId),
            documentId: DocumentId.create(employee.person.documentId),
            name: employee.person.name,
            companyName: employee.person.companyName,
            gender: employee.person.gender === null ? null : Gender[employee.person.gender],
            phone: employee.person.phone === null ? null : Phone.create(employee.person.phone),
            profiles: new Set(employee.person.profiles.map((profile) => PersonProfile[profile])),
            personType: PersonType[employee.person.personType],
            positionId: EmployeePositionId.from(employee.positionId),
            allowSystemAccess: employee.allowSystemAccess,
            userId: employee.userId === null ? null : UserId.from(employee.userId),
        });
    }

    private static denormalize(employee: Employee): EmployeeModel {
        return {
            id: employee.id.toString(),
            positionId: employee.positionId.toString(),
            allowSystemAccess: employee.allowSystemAccess,
            userId: employee.userId?.toString() ?? null,
            createdAt: employee.createdAt,
            updatedAt: employee.updatedAt,
            person: {
                id: employee.id.toString(),
                companyId: employee.companyId.toString(),
                documentId: employee.documentId.toString(),
                name: employee.name,
                companyName: employee.companyName ?? null,
                gender: employee.gender ?? null,
                profiles: [...employee.profiles],
                personType: employee.personType,
                phone: employee.phone?.toString() ?? null,
                createdAt: employee.createdAt,
                updatedAt: employee.updatedAt,
            },
        };
    }

    async findById(id: PersonId): Promise<Employee | null> {
        const employee = await this.prisma.employee.findUnique({
            where: {
                id: id.toString(),
            },
            include: {
                person: true,
            },
        });

        return employee === null ? null : EmployeePrismaRepository.normalize(employee);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<EmployeeSortOptions>,
        filter: EmployeeSearchFilter = {}
    ): Promise<PaginatedList<Employee>> {
        const where: PrismaClient.Prisma.EmployeeWhereInput = {
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
            positionId: filter?.positionId?.toString(),
        };

        const {createdAt, updatedAt, ...personSort} = pagination.sort;

        const [employees, totalCount] = await Promise.all([
            this.prisma.employee.findMany({
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
            this.prisma.employee.count({where}),
        ]);

        return {
            data: employees.slice(0, pagination.limit).map((employee) => EmployeePrismaRepository.normalize(employee)),
            totalCount,
            nextCursor: employees.length > pagination.limit ? employees[employees.length - 1].id : null,
        };
    }

    async save(employee: Employee): Promise<void> {
        const {id, person, ...employeeModel} = EmployeePrismaRepository.denormalize(employee);

        try {
            await this.prisma.person.upsert({
                where: {
                    id,
                },
                create: {
                    ...person,
                    employee: {
                        connectOrCreate: {
                            where: {
                                id,
                            },
                            create: employeeModel,
                        },
                    },
                },
                update: {
                    ...person,
                    employee: {
                        connectOrCreate: {
                            where: {
                                id,
                            },
                            create: employeeModel,
                        },
                        update: employeeModel,
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
        await this.prisma.employee.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
