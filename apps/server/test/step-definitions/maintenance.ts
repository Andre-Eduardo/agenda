import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {DefectId} from '../../src/domain/defect/entities';
import {Maintenance} from '../../src/domain/maintenance/entities';
import {MaintenanceRepository} from '../../src/domain/maintenance/maintenance.repository';
import {RoomStatusId} from '../../src/domain/room-status/entities';
import {UserId} from '../../src/domain/user/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type MaintenanceEntry = {
    companyId?: string;
    room?: string;
    finishedAt?: string;
    note?: string;
    defects?: string[];
    startedById?: string;
    finishedById?: string;
    startedAt?: string;
    createdAt?: string;
    updatedAt?: string;
};

const maintenanceHeaderMap: Record<string, keyof MaintenanceEntry> = {
    'Company ID': 'companyId',
    Room: 'room',
    'Finished at': 'finishedAt',
    Note: 'note',
    Defects: 'defects',
    'Start user ID': 'startedById',
    'End user ID': 'finishedById',
    'Started at': 'startedAt',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following maintenances exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const maintenances = multipleEntries<MaintenanceEntry>(this, table, maintenanceHeaderMap);

        for (const entry of maintenances) {
            if (!entry.room) {
                throw new Error('Maintenance room is required');
            }

            await createMaintenance(this, companyName, entry.room, entry);
        }
    }
);

async function createMaintenance(
    context: Context,
    company: string,
    room: string,
    entry: MaintenanceEntry
): Promise<void> {
    const roomId = context.variables.ids.companyScope.room[company][room];
    const companyId = context.variables.ids.company[company];

    if (roomId == null) {
        throw new Error(`The room ${entry.room} must be created before creating a maintenance.`);
    }

    if (entry.defects === undefined) {
        throw new Error(`The defects ${entry.room} must be created before creating a maintenance.`);
    }

    const maintenance = new Maintenance({
        id: RoomStatusId.generate(),
        companyId,
        roomId,
        finishedAt: entry.finishedAt ? new Date(entry.finishedAt) : null,
        note: entry.note ?? 'Door is broken',
        defects: entry.defects.map((defectId) => DefectId.from(defectId)),
        startedById: entry.startedById === undefined ? UserId.generate() : UserId.from(entry.startedById),
        finishedById: entry.finishedById ? UserId.from(entry.finishedById) : null,
        startedAt: entry.startedAt ? new Date(entry.startedAt) : new Date(),
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(maintenance);

    context.setVariableId('maintenance', room, maintenance.id, company);
}

Then(
    'should exist maintenances in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const maintenances = multipleEntries<MaintenanceEntry>(this, table, maintenanceHeaderMap);

        const existingMaintenances = await this.prisma.maintenance.findMany({
            where: {
                OR: maintenances.map((entry) => ({
                    note: entry.note,
                    defects: {
                        every: {
                            defectId: {
                                in: entry.defects?.map((defect) => defect),
                            },
                        },
                    },
                    roomStatus: {
                        finishedAt: entry.finishedAt,
                        startedById: entry.startedById,
                        finishedById: entry.finishedById,
                        startedAt: entry.startedAt,
                        company: {
                            name: company,
                        },
                        room: {
                            number: entry.room ? parseInt(entry.room, 10) : undefined,
                        },
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                    },
                })),
            },
            include: {
                defects: true,
            },
        });

        chai.expect(existingMaintenances).to.have.lengthOf(
            maintenances.length,
            'The number of maintenances found does not match the expected number'
        );
    }
);

function repository(context: Context) {
    return context.app.get(MaintenanceRepository);
}
