import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {DefectTypeRepository} from '../../src/domain/defect-type/defect-type.repository';
import {DefectType, DefectTypeId} from '../../src/domain/defect-type/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type DefectTypeEntry = {
    companyId?: string;
    name?: string;
    createdAt?: string;
    updatedAt?: string;
};

const defectTypeHeaderMap: Record<string, keyof DefectTypeEntry> = {
    'Company ID': 'companyId',
    Name: 'name',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following defect types exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const defectTypes = multipleEntries<DefectTypeEntry>(this, table, defectTypeHeaderMap);

        for (const entry of defectTypes) {
            await createDefectType(this, companyName, entry);
        }
    }
);

async function createDefectType(context: Context, company: string, entry: DefectTypeEntry): Promise<void> {
    const defectType = new DefectType({
        id: DefectTypeId.generate(),
        companyId: context.variables.ids.company[company],
        name: entry.name ?? `randomDefectType-${randomInt(1000)}`,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(defectType);

    context.setVariableId('defectType', defectType.name, defectType.id, company);
}

Then(
    'should exist defect types in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const defectTypes = multipleEntries<DefectTypeEntry>(this, table, defectTypeHeaderMap);

        const existingDefectTypes = await this.prisma.defectType.findMany({
            where: {
                OR: defectTypes.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(existingDefectTypes).to.have.lengthOf(
            defectTypes.length,
            'The number of defect types found does not match the expected number'
        );
    }
);

Then(
    'the following defect types in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const defectTypes = multipleEntries<DefectTypeEntry>(this, table, defectTypeHeaderMap);

        const existingDefectTypesCount = await this.prisma.defectType.count({
            where: {
                company: {
                    name: company,
                },
            },
        });
        const foundDefectTypes = await this.prisma.defectType.findMany({
            where: {
                OR: defectTypes.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(foundDefectTypes).to.have.lengthOf(
            defectTypes.length,
            'The number of found defect types does not match the expected number'
        );

        chai.expect(foundDefectTypes).to.have.lengthOf(
            existingDefectTypesCount,
            'The number of found defect types does not match the number of existing defect types'
        );
    }
);

function repository(context: Context) {
    return context.app.get(DefectTypeRepository);
}
