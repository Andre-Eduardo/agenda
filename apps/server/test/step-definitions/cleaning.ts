import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {CleaningRepository} from '../../src/domain/cleaning/cleaning.repository';
import {Cleaning, CleaningEndReasonType} from '../../src/domain/cleaning/entities';
import {RoomStatusId} from '../../src/domain/room-status/entities';
import {UserId} from '../../src/domain/user/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type CleaningEntry = {
    companyId?: string;
    room?: string;
    finishedAt?: string;
    endReason?: keyof typeof CleaningEndReasonType | null;
    startedById?: string;
    finishedById?: string;
    startedAt?: string;
    createdAt?: string;
    updatedAt?: string;
};

const cleaningHeaderMap: Record<string, keyof CleaningEntry> = {
    'Company ID': 'companyId',
    Room: 'room',
    'Finished at': 'finishedAt',
    'End reason': 'endReason',
    'Start user ID': 'startedById',
    'End user ID': 'finishedById',
    'Started at': 'startedAt',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following cleanings exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const cleanings = multipleEntries<CleaningEntry>(this, table, cleaningHeaderMap);

        for (const entry of cleanings) {
            if (!entry.room) {
                throw new Error('Cleaning room is required');
            }

            await startCleaning(this, companyName, entry.room, entry);
        }
    }
);

async function startCleaning(context: Context, company: string, room: string, entry: CleaningEntry): Promise<void> {
    const roomId = context.variables.ids.companyScope.room[company][room];

    const cleaning = new Cleaning({
        id: RoomStatusId.generate(),
        companyId: context.variables.ids.company[company],
        roomId,
        finishedAt: entry.finishedAt ? new Date(entry.finishedAt) : null,
        endReason:
            entry.endReason !== undefined && entry.endReason !== null ? CleaningEndReasonType[entry.endReason] : null,
        startedById: entry.startedById === undefined ? UserId.generate() : UserId.from(entry.startedById),
        finishedById: entry.finishedById ? UserId.from(entry.finishedById) : null,
        startedAt: entry.startedAt ? new Date(entry.startedAt) : new Date(),
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(cleaning);

    context.setVariableId('cleaning', `${room}`, cleaning.id, company);
}

Then(
    'should exist cleanings in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const cleanings = multipleEntries<CleaningEntry>(this, table, cleaningHeaderMap);

        const existingCleanings = await this.prisma.cleaning.findMany({
            where: {
                OR: cleanings.map((entry) => ({
                    endReason: entry.endReason,
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
        });

        chai.expect(existingCleanings).to.have.lengthOf(
            cleanings.length,
            'The number of cleanings found does not match the expected number'
        );
    }
);

function repository(context: Context) {
    return context.app.get(CleaningRepository);
}
