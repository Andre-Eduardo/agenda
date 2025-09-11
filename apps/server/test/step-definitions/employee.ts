import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import * as PrismaClient from '@prisma/client';
import {uuidv7} from 'uuidv7';
import {DocumentId, Phone} from '../../src/domain/@shared/value-objects';
import {EmployeeRepository} from '../../src/domain/employee/employee.repository';
import {Employee} from '../../src/domain/employee/entities';
import type {EmployeePositionId} from '../../src/domain/employee-position/entities';
import {Gender, PersonId, PersonProfile, PersonType} from '../../src/domain/person/entities';
import type {UserId} from '../../src/domain/user/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';
import {createEmployeePosition} from './employee-position';
import {createUser} from './user';

type EmployeeEntry = {
    id?: string;
    name?: string;
    companyId?: string;
    documentId?: string;
    companyName?: string | null;
    personType?: keyof typeof PersonType;
    phone?: string | null;
    gender?: keyof typeof Gender | null;
    positionName?: string;
    allowSystemAccess?: boolean;
    user?: string | null;
    permissions?: string[];
    createdAt?: string;
    updatedAt?: string;
};

const employeeHeaderMap: Record<string, keyof EmployeeEntry> = {
    ID: 'id',
    Name: 'name',
    'Company name': 'companyName',
    'Person type': 'personType',
    'Company ID': 'companyId',
    'Document ID': 'documentId',
    Phone: 'phone',
    Gender: 'gender',
    Position: 'positionName',
    'Allow system access': 'allowSystemAccess',
    User: 'user',
    Permissions: 'permissions',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following employees exist in the company {string}:',
    async function (this: Context, company: string, table: DataTable) {
        const employees = multipleEntries<EmployeeEntry>(this, table, employeeHeaderMap);

        for (const entry of employees) {
            await createEmployee(this, company, entry.documentId ?? randomInt(0, 1000).toString(), entry);
        }
    }
);

Given(
    'the following employees with system access in the company {string} exist:',
    async function (this: Context, company: string, table: DataTable) {
        const employees = multipleEntries<EmployeeEntry>(this, table, employeeHeaderMap);

        for (const entry of employees) {
            await createEmployee(this, company, entry.documentId ?? randomInt(0, 10000).toString(), {
                ...entry,
                allowSystemAccess: true,
            });
        }
    }
);

async function createEmployee(
    context: Context,
    company: string,
    documentId: string,
    entry: EmployeeEntry
): Promise<void> {
    let positionId: EmployeePositionId;

    if (entry.positionName == null) {
        positionId = await createEmployeePosition(context, company, uuidv7(), {
            permissions: entry.permissions,
        }).then(({id}) => id);
    } else {
        positionId = context.variables.ids.companyScope.employeePosition[company][entry.positionName];

        if (positionId == null) {
            throw new Error(`The employee position ${entry.positionName} must be created before creating an employee.`);
        }
    }

    let userId: UserId | null = null;

    if (entry.user != null) {
        userId = context.variables.ids.user[entry.user];

        if (userId == null) {
            userId = (await createUser(context, entry.user, {companies: [company]})).id;
        } else {
            await context.prisma.user.update({
                where: {
                    id: userId.toString(),
                },
                data: {
                    companies: {
                        create: {
                            companyId: context.variables.ids.company[company].toString(),
                        },
                    },
                },
            });
        }
    }

    const employee = new Employee({
        id: entry.id === undefined ? PersonId.generate() : PersonId.from(entry.id),
        phone: entry.phone ? Phone.create(entry.phone) : null,
        companyId: context.variables.ids.company[company],
        gender: entry.gender == null ? entry.gender : Gender[entry.gender],
        companyName: entry.companyName ?? undefined,
        name: entry.name ?? `randomEmployee-${randomInt(1000)}`,
        positionId,
        profiles: new Set([PersonProfile.EMPLOYEE]),
        personType: PersonType[entry.personType ?? PersonType.NATURAL],
        documentId: DocumentId.create(documentId),
        allowSystemAccess: entry.allowSystemAccess ?? false,
        userId,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(employee);

    context.setVariableId('employee', employee.documentId, employee.id, company);
}

Then(
    'should exist employees in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const employees = multipleEntries<EmployeeEntry>(this, table, employeeHeaderMap);

        const existingEmployees = await this.prisma.employee.findMany({
            where: {
                OR: employees.map((entry) => ({
                    person: {
                        id: entry.id,
                        companyId: this.getVariableId('company', company).toString(),
                        name: entry.name,
                        companyName: entry.companyName,
                        documentId:
                            entry.documentId === undefined ? undefined : DocumentId.create(entry.documentId).toString(),
                        phone: entry.phone == null ? entry.phone : Phone.create(entry.phone).toString(),
                        gender: entry.gender,
                        personType: entry.personType,
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                        profiles: {
                            has: PrismaClient.PersonProfile.EMPLOYEE,
                        },
                    },
                    position: {
                        name: entry.positionName,
                    },
                    allowSystemAccess: entry.allowSystemAccess,
                    user: {
                        username: entry.user ?? undefined,
                    },
                })),
            },
        });

        chai.expect(existingEmployees).to.have.lengthOf(
            employees.length,
            'The number of employee found does not match the expected number'
        );
    }
);

Then(
    'the following employees in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const employees = multipleEntries<EmployeeEntry>(this, table, employeeHeaderMap);

        const existingEmployeesCount = await this.prisma.employee.count({
            where: {
                person: {
                    company: {
                        name: company,
                    },
                },
            },
        });
        const foundEmployees = await this.prisma.employee.findMany({
            where: {
                OR: employees.map((entry) => ({
                    person: {
                        id: entry.id,
                        companyId: this.getVariableId('company', company).toString(),
                        name: entry.name,
                        companyName: entry.companyName,
                        documentId:
                            entry.documentId === undefined ? undefined : DocumentId.create(entry.documentId).toString(),
                        phone: entry.phone == null ? entry.phone : Phone.create(entry.phone).toString(),
                        gender: entry.gender,
                        personType: entry.personType,
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                        profiles: {
                            has: PrismaClient.PersonProfile.EMPLOYEE,
                        },
                    },
                    position: {
                        name: entry.positionName,
                    },
                    allowSystemAccess: entry.allowSystemAccess,
                    user: {
                        username: entry.user ?? undefined,
                    },
                })),
            },
            include: {
                person: true,
            },
        });

        chai.expect(foundEmployees).to.have.lengthOf(
            employees.length,
            'The number of found employees does not match the expected number'
        );

        chai.expect(foundEmployees).to.have.lengthOf(
            existingEmployeesCount,
            'The number of found employees does not match the number of existing employees'
        );
    }
);

Then(
    'no employee with document ID {string} should exist in the company {string}',
    async function (this: Context, documentId: string, company: string) {
        const employee = await this.prisma.employee.findMany({
            where: {
                person: {
                    company: {
                        name: company,
                    },
                    documentId: DocumentId.create(documentId).toString(),
                },
            },
        });

        chai.expect(employee).to.be.an('array').of.length(0, 'Employee found');
    }
);

function repository(context: Context) {
    return context.app.get(EmployeeRepository);
}
