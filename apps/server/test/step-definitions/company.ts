import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {CompanyRepository} from '../../src/domain/company/company.repository';
import {Company, CompanyId} from '../../src/domain/company/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type CompanyEntry = {
    name?: string;
    createdAt?: string;
    updatedAt?: string;
};

const companyHeaderMap: Record<string, keyof CompanyEntry> = {
    Name: 'name',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given('a company with name {string} exists', async function (this: Context, name: string) {
    await createCompany(this, name, {});
});

Given('the following companies exist:', async function (this: Context, table: DataTable) {
    const companies = multipleEntries<CompanyEntry>(this, table, companyHeaderMap);

    for (const entry of companies) {
        await createCompany(this, entry.name ?? `Random Company ${randomInt(1000)}`, entry);
    }
});

async function createCompany(context: Context, name: string, entry: CompanyEntry): Promise<void> {
    const company = new Company({
        id: CompanyId.generate(),
        name,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(company);

    context.setVariableId('company', company.name, company.id);
}

Then('a company with name {string} should exist', async function (this: Context, name: string) {
    const companies = await this.prisma.company.findMany({
        where: {
            name,
        },
    });

    chai.expect(companies).to.be.an('array').of.length(1, 'None or more than one company found');
});

Then('should exist companies with the following data:', async function (this: Context, table: DataTable) {
    const companies = multipleEntries<CompanyEntry>(this, table, companyHeaderMap);

    const existingCompanies = await this.prisma.company.findMany({
        where: {
            OR: companies.map((entry) => ({
                name: entry.name,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
            })),
        },
    });

    chai.expect(existingCompanies).to.have.lengthOf(
        companies.length,
        'The number of companies found does not match the expected number'
    );
});

Then('the following companies should exist:', async function (this: Context, table: DataTable) {
    const companies = multipleEntries<CompanyEntry>(this, table, companyHeaderMap);

    const existingCompaniesCount = await this.prisma.company.count();
    const foundCompanies = await this.prisma.company.findMany({
        where: {
            OR: companies.map((entry) => ({
                name: entry.name,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
            })),
        },
    });

    chai.expect(foundCompanies).to.have.lengthOf(
        companies.length,
        'The number of found companies does not match the expected number'
    );

    chai.expect(foundCompanies).to.have.lengthOf(
        existingCompaniesCount,
        'The number of found companies does not match the number of existing companies'
    );
});

Then('no company with name {string} should exist', async function (this: Context, name: string) {
    const companies = await this.prisma.company.findMany({
        where: {
            name,
        },
    });

    chai.expect(companies).to.be.an('array').of.length(0, 'Company found');
});

function repository(context: Context) {
    return context.app.get(CompanyRepository);
}
