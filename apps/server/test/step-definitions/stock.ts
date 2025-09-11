import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {RoomId} from '../../src/domain/room/entities';
import {StockType, Stock, StockId} from '../../src/domain/stock/entities';
import {StockRepository} from '../../src/domain/stock/stock.repository';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type StockEntry = {
    companyId?: string;
    name?: string;
    roomId?: string;
    roomNumber?: number;
    type?: StockType;
    parentId?: string;
    createdAt?: string;
    updatedAt?: string;
};

const stockHeaderMap: Record<string, keyof StockEntry> = {
    'Company ID': 'companyId',
    Name: 'name',
    'Room ID': 'roomId',
    'Room number': 'roomNumber',
    Type: 'type',
    'Parent ID': 'parentId',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following stocks exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const stocks = multipleEntries<StockEntry>(this, table, stockHeaderMap);

        for (const entry of stocks) {
            await createStock(this, companyName, entry.roomNumber ?? null, entry);
        }
    }
);

async function createStock(
    context: Context,
    company: string,
    roomNumber: number | null,
    entry: StockEntry
): Promise<void> {
    const roomId = roomNumber ? context.variables.ids.companyScope.room[company][roomNumber] : null;
    const parentId = entry.parentId ? StockId.from(entry.parentId) : null;

    const stock = new Stock({
        id: StockId.generate(),
        companyId: context.variables.ids.company[company],
        roomId,
        name: entry.name ? entry.name : null,
        type: StockType[entry.type ?? StockType.OTHER],
        parentId,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(stock);

    const stockKeyMapping = {
        [StockType.ROOM]: `room.${roomNumber}`,
        [StockType.OTHER]: `other.${stock.name}`,
        [StockType.HALLWAY]: `hallway.${stock.name}`,
        [StockType.MAIN]: `main.${stock.type}`,
    };

    const stockKey = stockKeyMapping[stock.type];

    if (stockKey) {
        context.setVariableId('stock', stockKey, stock.id, company);
    }
}

Then(
    'should exist stocks in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const stocks = multipleEntries<StockEntry>(this, table, stockHeaderMap);

        const existingStocks = await this.prisma.stock.findMany({
            where: {
                OR: stocks.map((entry) => ({
                    company: {
                        name: company,
                    },
                    type: entry.type,
                    name: entry.name ? entry.name : null,
                    room: {
                        id: entry.roomId ?? undefined,
                    },
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(existingStocks).to.have.lengthOf(
            stocks.length,
            'The number of stocks found does not match the expected number'
        );
    }
);
Then(
    'the following stocks in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const stocks = multipleEntries<StockEntry>(this, table, stockHeaderMap);

        const existingStocksCount = await this.prisma.stock.count({
            where: {
                company: {
                    name: company,
                },
            },
        });

        const foundStocks = await this.prisma.stock.findMany({
            where: {
                OR: stocks.map((entry) => ({
                    company: {
                        name: company,
                    },
                    type: entry.type,
                    name: entry.name ? entry.name : null,
                    roomId: entry.roomId ? RoomId.from(entry.roomId).toString() : null,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(foundStocks).to.have.lengthOf(
            stocks.length,
            'The number of found stocks does not match the expected number'
        );

        chai.expect(foundStocks).to.have.lengthOf(
            existingStocksCount,
            'The number of found stocks does not match the number of existing stocks'
        );
    }
);

function repository(context: Context) {
    return context.app.get(StockRepository);
}
