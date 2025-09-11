import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {DefectRepository} from '../../src/domain/defect/defect.repository';
import {Defect, DefectId} from '../../src/domain/defect/entities';
import {UserId} from '../../src/domain/user/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type DefectEntry = {
    companyId?: string;
    note?: string;
    room?: string;
    defectType?: string;
    createdById?: string;
    finishedById?: string;
    finishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
};

const defectHeaderMap: Record<string, keyof DefectEntry> = {
    'Company ID': 'companyId',
    Note: 'note',
    Room: 'room',
    'Defect Type': 'defectType',
    'Created by ID': 'createdById',
    'Finished by ID': 'finishedById',
    'Finished at': 'finishedAt',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following defects exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const defects = multipleEntries<DefectEntry>(this, table, defectHeaderMap);

        for (const entry of defects) {
            if (!entry.defectType) {
                throw new Error('Defect Type must have a created By');
            }

            if (!entry.room) {
                throw new Error('Room must have a created By');
            }

            await createDefect(this, companyName, entry.room, entry.defectType, entry);
        }
    }
);

async function createDefect(
    context: Context,
    company: string,
    room: string,
    defectType: string,
    entry: DefectEntry
): Promise<void> {
    const roomId = context.variables.ids.companyScope.room[company][room];
    const defectTypeId = context.variables.ids.companyScope.defectType[company][defectType];

    if (roomId == null) {
        throw new Error(`The room ${entry.room} must be created before creating a defect.`);
    }

    if (defectTypeId == null) {
        throw new Error(`The defect type ${entry.defectType} must be created before creating a defect.`);
    }

    const defect = new Defect({
        id: DefectId.generate(),
        companyId: context.variables.ids.company[company],
        note: entry.note ?? `defect-${randomInt(0, 1000)}`,
        roomId,
        defectTypeId,
        createdById: entry.createdById ? UserId.from(entry.createdById) : UserId.generate(),
        finishedById: entry.finishedById ? UserId.from(entry.finishedById) : null,
        finishedAt: entry.finishedAt ? new Date(entry.finishedAt) : null,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(defect);

    context.setVariableId('defect', `${room}.${defectType}`, defect.id, company);
}

Then(
    'should exist defects in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const defects = multipleEntries<DefectEntry>(this, table, defectHeaderMap);

        const existingDefects = await this.prisma.defect.findMany({
            where: {
                OR: defects.map((entry) => ({
                    company: {
                        name: company,
                    },
                    note: entry.note,
                    room: {
                        number: entry.room ? parseInt(entry.room, 10) : undefined,
                    },
                    defectType: {
                        name: entry.defectType,
                    },
                    createdById: entry.createdById,
                    finishedById: entry.finishedById,
                    finishedAt: entry.finishedAt,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(existingDefects).to.have.lengthOf(
            defects.length,
            'The number of defects found does not match the expected number'
        );
    }
);

Then(
    'the following defects in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const defects = multipleEntries<DefectEntry>(this, table, defectHeaderMap);

        const existingDefectsCount = await this.prisma.defect.count({
            where: {
                company: {
                    name: company,
                },
            },
        });

        const foundDefects = await this.prisma.defect.findMany({
            where: {
                OR: defects.map((entry) => ({
                    company: {
                        name: company,
                    },
                    note: entry.note,
                    room: {
                        number: entry.room ? parseInt(entry.room, 10) : undefined,
                    },
                    defectType: {
                        name: entry.defectType,
                    },
                    createdById: entry.createdById,
                    finishedById: entry.finishedById,
                    finishedAt: entry.finishedAt,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(foundDefects).to.have.lengthOf(
            defects.length,
            'The number of found defects does not match the expected number'
        );

        chai.expect(foundDefects).to.have.lengthOf(
            existingDefectsCount,
            'The number of found defects does not match the number of existing defects'
        );
    }
);

function repository(context: Context) {
    return context.app.get(DefectRepository);
}
