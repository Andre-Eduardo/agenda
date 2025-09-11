import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import * as chai from 'chai';
import {Permission} from '../../src/domain/auth';
import {EmployeePositionRepository} from '../../src/domain/employee-position/employee-position.repository';
import {EmployeePosition, EmployeePositionId} from '../../src/domain/employee-position/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type EmployeePositionEntry = {
    id?: string;
    name?: string;
    permissions?: string[];
    companyId?: string;
    createdAt?: string;
    updatedAt?: string;
};

const employeePositionHeaderMap: Record<string, keyof EmployeePositionEntry> = {
    ID: 'id',
    Name: 'name',
    Permissions: 'permissions',
    'Company ID': 'companyId',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'an employee position with name {string} in the company {string} exists',
    async function (this: Context, employeePositionName: string, companyName: string) {
        await createEmployeePosition(this, companyName, employeePositionName, {});
    }
);

Given(
    'the following employee positions exist in the company {string}:',
    async function (this: Context, company: string, dataTable: DataTable) {
        const employeePositions: EmployeePositionEntry[] = multipleEntries<EmployeePositionEntry>(
            this,
            dataTable,
            employeePositionHeaderMap
        );

        for (const entry of employeePositions) {
            await createEmployeePosition(this, company, entry.name ?? `Position ${randomInt(1000)}`, entry);
        }
    }
);

export async function createEmployeePosition(
    context: Context,
    company: string,
    positionName: string,
    entry: EmployeePositionEntry
): Promise<EmployeePosition> {
    const employeePosition = new EmployeePosition({
        id: EmployeePositionId.generate(),
        companyId: context.variables.ids.company[company],
        name: positionName,
        permissions: new Set(entry.permissions?.map((permission) => Permission.of(permission)) ?? []),
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(employeePosition);
    context.setVariableId('employeePosition', employeePosition.name, employeePosition.id, company);

    return employeePosition;
}

Then(
    'should exist employee positions in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const employeePositions = multipleEntries<EmployeePositionEntry>(this, table, employeePositionHeaderMap);

        const existingEmployeePositions = await this.prisma.employeePosition.findMany({
            where: {
                OR: employeePositions.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                })),
            },
        });

        chai.expect(existingEmployeePositions).to.have.lengthOf(
            employeePositions.length,
            'The number of employee positions found does not match the expected number'
        );
    }
);

Then(
    'the following employee positions in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const employeePositions = multipleEntries<EmployeePositionEntry>(this, table, employeePositionHeaderMap);

        const existingEmployeePositionsCount = await this.prisma.employeePosition.count({
            where: {
                company: {
                    name: company,
                },
            },
        });
        const foundEmployeePositions = await this.prisma.employeePosition.findMany({
            where: {
                OR: employeePositions.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                })),
            },
        });

        chai.expect(foundEmployeePositions).to.have.lengthOf(
            employeePositions.length,
            'The number of found employee positions does not match the expected number'
        );

        chai.expect(foundEmployeePositions).to.have.lengthOf(
            existingEmployeePositionsCount,
            'The number of found employee positions does not match the number of existing employee positions'
        );
    }
);

Then(
    'No employee position with name {string} should exist in the company {string}',
    async function (this: Context, name: string, company: string) {
        const employeePositions = await this.prisma.employeePosition.findMany({
            where: {
                company: {
                    name: company,
                },
                name,
            },
        });

        chai.expect(employeePositions).to.be.an('array').of.length(0, 'Employee position found');
    }
);

function repository(context: Context) {
    return context.app.get(EmployeePositionRepository);
}
