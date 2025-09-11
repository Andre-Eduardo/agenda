import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {RoomCategory, RoomCategoryId} from '../../src/domain/room-category/entities';
import {RoomCategoryRepository} from '../../src/domain/room-category/room-category.repository';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type CategoryEntry = {
    companyId?: string;
    name?: string;
    acronym?: string;
    guestCount?: number;
    createdAt?: string;
    updatedAt?: string;
};

const roomCategoryHeaderMap: Record<string, keyof CategoryEntry> = {
    'Company ID': 'companyId',
    Name: 'name',
    Acronym: 'acronym',
    'Guest count': 'guestCount',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'a room category with name {string} in the company {string} exists',
    async function (this: Context, roomCategoryName: string, companyName: string) {
        await createRoomCategory(this, companyName, roomCategoryName, {});
    }
);

Given(
    'the following room categories exist in the company {string}:',
    async function (this: Context, company: string, dataTable: DataTable) {
        const categories: CategoryEntry[] = multipleEntries<CategoryEntry>(this, dataTable, roomCategoryHeaderMap);

        for (const entry of categories) {
            await createRoomCategory(this, company, entry.name ?? `Category ${randomInt(1000)}`, entry);
        }
    }
);

async function createRoomCategory(
    context: Context,
    company: string,
    categoryName: string,
    entry: CategoryEntry
): Promise<void> {
    const roomCategory = new RoomCategory({
        id: RoomCategoryId.generate(),
        companyId: context.variables.ids.company[company],
        name: categoryName,
        acronym: entry.acronym ?? Math.random().toString(36).substring(2, 4).toUpperCase(),
        guestCount: entry.guestCount ?? 1,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(roomCategory);
    context.setVariableId('roomCategory', roomCategory.name, roomCategory.id, company);
}

Then(
    'should exist room categories in the company {string} with the following data:',
    async function (this: Context, company: string, dataTable: DataTable) {
        const categories: CategoryEntry[] = multipleEntries<CategoryEntry>(this, dataTable, roomCategoryHeaderMap);

        const existingCategories = await this.prisma.roomCategory.findMany({
            where: {
                OR: categories.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                    acronym: entry.acronym,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(existingCategories).to.have.lengthOf(
            categories.length,
            'The number of room categories found does not match the expected number'
        );
    }
);

Then(
    'the following room categories in the company {string} should exist:',
    async function (this: Context, company: string, dataTable: DataTable) {
        const categories: CategoryEntry[] = multipleEntries<CategoryEntry>(this, dataTable, roomCategoryHeaderMap);

        const existingCategoriesCount = await this.prisma.roomCategory.count({
            where: {
                company: {
                    name: company,
                },
            },
        });
        const foundCategories = await this.prisma.roomCategory.findMany({
            where: {
                OR: categories.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                    acronym: entry.acronym,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(foundCategories).to.have.lengthOf(
            categories.length,
            'The number of found room categories does not match the expected number'
        );

        chai.expect(foundCategories).to.have.lengthOf(
            existingCategoriesCount,
            'The number of found room categories does not match the number of existing room categories'
        );
    }
);

Then(
    'no room category with name {string} should exist in the company {string}',
    async function (this: Context, name: string, company: string) {
        const categories = await this.prisma.roomCategory.findMany({
            where: {
                company: {
                    name: company,
                },
                name,
            },
        });

        chai.expect(categories).to.be.an('array').of.length(0, 'Room category found');
    }
);

function repository(context: Context) {
    return context.app.get(RoomCategoryRepository);
}
