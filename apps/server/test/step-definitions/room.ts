import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {Room, RoomId} from '../../src/domain/room/entities';
import {RoomState} from '../../src/domain/room/models/room-state';
import {RoomRepository} from '../../src/domain/room/room.repository';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type RoomEntry = {
    companyId?: string;
    categoryId?: string;
    number?: number;
    name?: string;
    state?: keyof typeof RoomState;
    createdAt?: string;
    updatedAt?: string;
};

const roomHeaderMap: Record<string, keyof RoomEntry> = {
    'Company ID': 'companyId',
    'Category ID': 'categoryId',
    Number: 'number',
    Name: 'name',
    State: 'state',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following rooms exist in the company {string} and room category {string}:',
    async function (this: Context, companyName: string, roomCategoryName: string, table: DataTable) {
        const rooms = multipleEntries<RoomEntry>(this, table, roomHeaderMap);

        for (const entry of rooms) {
            await createRoom(this, companyName, roomCategoryName, entry.number ?? randomInt(1, 1000), entry);
        }
    }
);

async function createRoom(
    context: Context,
    company: string,
    roomCategory: string,
    number: number,
    entry: RoomEntry
): Promise<void> {
    const roomId = RoomId.generate();

    const room = new Room({
        id: roomId,
        companyId: context.variables.ids.company[company],
        categoryId: context.variables.ids.companyScope.roomCategory[company][roomCategory],
        number,
        name: entry.name ?? null,
        state: RoomState[entry.state ?? RoomState.VACANT],
        stateSnapshot: {
            status: 'active',
            value: entry.state ?? RoomState.VACANT,
            context: {
                roomId: roomId.toJSON(),
                isRentalCheckout: false,
                previousState: null,
            },
            historyValue: {},
            children: {},
        },
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(room);

    context.setVariableId('room', room.number, room.id, company);
}

Then(
    'should exist rooms in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const rooms = multipleEntries<RoomEntry>(this, table, roomHeaderMap);

        const existingRooms = await this.prisma.room.findMany({
            where: {
                OR: rooms.map((entry) => ({
                    company: {
                        name: company,
                    },
                    number: entry.number,
                    name: entry.name,
                    state: entry.state,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(existingRooms).to.have.lengthOf(
            rooms.length,
            'The number of rooms found does not match the expected number'
        );
    }
);

Then(
    'the following rooms in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const rooms = multipleEntries<RoomEntry>(this, table, roomHeaderMap);

        const existingRoomsCount = await this.prisma.room.count({
            where: {
                company: {
                    name: company,
                },
            },
        });
        const foundRooms = await this.prisma.room.findMany({
            where: {
                OR: rooms.map((entry) => ({
                    company: {
                        name: company,
                    },
                    number: entry.number,
                    name: entry.name,
                    state: entry.state,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(foundRooms).to.have.lengthOf(
            rooms.length,
            'The number of found rooms does not match the expected number'
        );

        chai.expect(foundRooms).to.have.lengthOf(
            existingRoomsCount,
            'The number of found rooms does not match the number of existing rooms'
        );
    }
);

function repository(context: Context) {
    return context.app.get(RoomRepository);
}
