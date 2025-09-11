import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {DeepCleaningRepository} from '../../src/domain/deep-cleaning/deep-cleaning.repository';
import {DeepCleaningEndReasonType, DeepCleaning} from '../../src/domain/deep-cleaning/entities';
import {RoomStatusId} from '../../src/domain/room-status/entities';
import {UserId} from '../../src/domain/user/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type DeepCleaningEntry = {
    companyId?: string;
    room?: string;
    finishedAt?: string;
    endReason?: keyof typeof DeepCleaningEndReasonType | null;
    startedById?: string;
    finishedById?: string;
    startedAt?: string;
    createdAt?: string;
    updatedAt?: string;
};

const deepCleaningHeaderMap: Record<string, keyof DeepCleaningEntry> = {
    'Company ID': 'companyId',
    Room: 'room',
    'Finished at': 'finishedAt',
    'End Reason': 'endReason',
    'Start user ID': 'startedById',
    'Finish user ID': 'finishedById',
    'Started at': 'startedAt',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following deep cleanings exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const deepCleanings = multipleEntries<DeepCleaningEntry>(this, table, deepCleaningHeaderMap);

        for (const entry of deepCleanings) {
            if (!entry.room) {
                throw new Error('Deep cleaning room is required');
            }

            await startDeepCleaning(this, companyName, entry.room, entry);
        }
    }
);

async function startDeepCleaning(
    context: Context,
    company: string,
    room: string,
    entry: DeepCleaningEntry
): Promise<void> {
    const roomId = context.variables.ids.companyScope.room[company][room];
    const deepCleaning = new DeepCleaning({
        id: RoomStatusId.generate(),
        companyId: context.variables.ids.company[company],
        roomId,
        finishedAt: entry.finishedAt ? new Date(entry.finishedAt) : null,
        endReason:
            entry.endReason !== undefined && entry.endReason !== null
                ? DeepCleaningEndReasonType[entry.endReason]
                : null,
        startedById: entry.startedById === undefined ? UserId.generate() : UserId.from(entry.startedById),
        finishedById: entry.finishedById ? UserId.from(entry.finishedById) : null,
        startedAt: entry.startedAt ? new Date(entry.startedAt) : new Date(),
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(deepCleaning);

    context.setVariableId('deepCleaning', `${room}`, deepCleaning.id, company);
}

Then(
    'should exist deep cleanings in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const deepCleanings = multipleEntries<DeepCleaningEntry>(this, table, deepCleaningHeaderMap);

        const existingDeepCleanings = await this.prisma.deepCleaning.findMany({
            where: {
                OR: deepCleanings.map((entry) => ({
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

        chai.expect(existingDeepCleanings).to.have.lengthOf(
            deepCleanings.length,
            'The number of deep cleanings found does not match the expected number'
        );
    }
);

function repository(context: Context) {
    return context.app.get(DeepCleaningRepository);
}
