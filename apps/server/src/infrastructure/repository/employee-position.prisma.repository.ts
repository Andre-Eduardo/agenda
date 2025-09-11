import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import {DuplicateNameException} from '../../domain/@shared/exceptions';
import type {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {Permission} from '../../domain/auth';
import {CompanyId} from '../../domain/company/entities';
import {
    EmployeePositionRepository,
    EmployeePositionSearchFilter,
    EmployeePositionSortOptions,
} from '../../domain/employee-position/employee-position.repository';
import {EmployeePosition, EmployeePositionId} from '../../domain/employee-position/entities';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type EmployeePositionModel = PrismaClient.EmployeePosition;

@Injectable()
export class EmployeePositionPrismaRepository extends PrismaRepository implements EmployeePositionRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(employeePosition: EmployeePositionModel): EmployeePosition {
        return new EmployeePosition({
            ...employeePosition,
            id: EmployeePositionId.from(employeePosition.id),
            companyId: CompanyId.from(employeePosition.companyId),
            permissions: new Set(employeePosition.permissions.map((permission) => Permission.of(permission))),
        });
    }

    private static denormalize(employeePosition: EmployeePosition): EmployeePositionModel {
        return {
            id: employeePosition.id.toString(),
            companyId: employeePosition.companyId.toString(),
            name: employeePosition.name,
            permissions: [...employeePosition.permissions],
            createdAt: employeePosition.createdAt,
            updatedAt: employeePosition.updatedAt,
        };
    }

    async findById(id: EmployeePositionId): Promise<EmployeePosition | null> {
        const employeePosition = await this.prisma.employeePosition.findUnique({
            where: {id: id.toString()},
        });

        return employeePosition === null ? null : EmployeePositionPrismaRepository.normalize(employeePosition);
    }

    async findByUser(companyId: CompanyId, userId: UserId): Promise<EmployeePosition | null> {
        const employeePosition = await this.prisma.employeePosition.findFirst({
            where: {
                companyId: companyId.toString(),
                employees: {
                    some: {
                        userId: userId.toString(),
                    },
                },
            },
        });

        return employeePosition === null ? null : EmployeePositionPrismaRepository.normalize(employeePosition);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<EmployeePositionSortOptions>,
        filter?: EmployeePositionSearchFilter
    ): Promise<PaginatedList<EmployeePosition>> {
        const where: Prisma.EmployeePositionWhereInput = {
            companyId: companyId.toString(),
            name: {
                mode: 'insensitive',
                contains: filter?.name,
            },
        };

        const [employeePositions, totalCount] = await Promise.all([
            this.prisma.employeePosition.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.employeePosition.count({where}),
        ]);

        return {
            data: employeePositions
                .slice(0, pagination.limit)
                .map((employeePosition) => EmployeePositionPrismaRepository.normalize(employeePosition)),
            totalCount,
            nextCursor:
                employeePositions.length > pagination.limit ? employeePositions[employeePositions.length - 1].id : null,
        };
    }

    async save(employeePosition: EmployeePosition): Promise<void> {
        const employeePositionModel = EmployeePositionPrismaRepository.denormalize(employeePosition);

        try {
            await this.prisma.employeePosition.upsert({
                where: {
                    id: employeePositionModel.id,
                },
                update: employeePositionModel,
                create: employeePositionModel,
            });
        } catch (e) {
            if (this.checkUniqueViolation(e, 'name')) {
                throw new DuplicateNameException('Duplicate employee position name.');
            }

            throw e;
        }
    }

    async delete(id: EmployeePositionId): Promise<void> {
        await this.prisma.employeePosition.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
