import {type DataTable, Given, Then} from '@cucumber/cucumber';
import type {InspectionEndReasonType} from '../../src/domain/inspection/entities';
import {Inspection} from '../../src/domain/inspection/entities';
import {InspectionRepository} from '../../src/domain/inspection/inspection.repository';
import {RoomStatusId} from '../../src/domain/room-status/entities';
import {UserId} from '../../src/domain/user/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type InspectionEntry = {
    companyId?: string;
    room?: string;
    startedById?: string;
    startedAt?: string;
    finishedById?: string;
    finishedAt?: string;
    note?: string;
    endReason?: InspectionEndReasonType;
    createdAt?: string;
    updatedAt?: string;
};

const inspectionHeaderMap: Record<string, keyof InspectionEntry> = {
    'Company ID': 'companyId',
    Room: 'room',
    'Start user ID': 'startedById',
    'Started at': 'startedAt',
    'End user ID': 'finishedById',
    'Finished at': 'finishedAt',
    Note: 'note',
    'End Reason': 'endReason',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following inspections exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const inspections = multipleEntries<InspectionEntry>(this, table, inspectionHeaderMap);

        for (const entry of inspections) {
            if (!entry.room) {
                throw new Error('Inspection room is required');
            }

            await createInspection(this, companyName, entry.room, entry);
        }
    }
);

async function createInspection(
    context: Context,
    company: string,
    room: string,
    entry: InspectionEntry
): Promise<void> {
    const companyId = context.variables.ids.company[company];
    const roomId = context.variables.ids.companyScope.room[company][room];

    if (roomId == null) {
        throw new Error(`The room ${room} must be created before creating an inspection.`);
    }

    const inspection = new Inspection({
        id: RoomStatusId.generate(),
        companyId,
        roomId,
        startedById: entry.startedById === undefined ? UserId.generate() : UserId.from(entry.startedById),
        startedAt: entry.startedAt ? new Date(entry.startedAt) : new Date(),
        finishedById: entry.finishedById ? UserId.from(entry.finishedById) : null,
        finishedAt: entry.finishedAt ? new Date(entry.finishedAt) : null,
        note: entry.note ?? null,
        endReason: entry.endReason ?? null,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(inspection);

    context.setVariableId('inspection', room, inspection.id, company);
}

Then(
    'should exist inspections in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const inspections = multipleEntries<InspectionEntry>(this, table, inspectionHeaderMap);

        const existingInspections = await this.prisma.inspection.findMany({
            where: {
                OR: inspections.map((entry) => ({
                    note: entry.note,
                    endReason: entry.endReason,
                    roomStatus: {
                        company: {
                            name: company,
                        },
                        room: {
                            number: entry.room ? parseInt(entry.room, 10) : undefined,
                        },
                        startedById: entry.startedById,
                        startedAt: entry.startedAt,
                        finishedById: entry.finishedById,
                        finishedAt: entry.finishedAt,
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                    },
                })),
            },
        });

        chai.expect(existingInspections).to.have.lengthOf(
            inspections.length,
            'The number of inspections found does not match the expected number'
        );
    }
);

function repository(context: Context) {
    return context.app.get(InspectionRepository);
}
