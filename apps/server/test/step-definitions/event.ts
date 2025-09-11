import type {DataTable} from '@cucumber/cucumber';
import {Then} from '@cucumber/cucumber';
import type {JsonValue} from 'type-fest';
import type {EventType} from '../../src/domain/event/event.type';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';
import {waitFor} from './time';

type EventEntry = {
    companyId?: string;
    userId?: string;
    type?: EventType;
    payload?: JsonValue;
    timestamp?: Date;
};

const eventHeaderMap: Record<string, keyof EventEntry> = {
    'User ID': 'userId',
    'Company ID': 'companyId',
    Type: 'type',
    Payload: 'payload',
    Timestamp: 'timestamp',
};

Then(
    'the following events in the company {string} should be recorded:',
    async function (this: Context, company: string, table: DataTable) {
        // This is necessary to wait for the events to be saved in the database,
        // since the events are saved asynchronously outside the request scope.
        await waitFor(this, 100);

        const events = multipleEntries<EventEntry>(this, table, eventHeaderMap);

        const companyId = this.variables.ids.company[company].toString();

        const existingEvents = await this.prisma.event.findMany({
            where: {
                OR: events.map((entry) => ({
                    companyId,
                    userId: entry.userId,
                    type: entry.type,
                    timestamp: entry.timestamp,
                })),
            },
        });

        chai.expect(existingEvents).to.have.lengthOf(
            events.length,
            'The number of events found does not match the expected number'
        );
    }
);

Then('the following events should be recorded:', async function (this: Context, table: DataTable) {
    // This is necessary to wait for the events to be saved in the database,
    // since the events are saved asynchronously outside the request scope.
    await waitFor(this, 100);

    const events = multipleEntries<EventEntry>(this, table, eventHeaderMap);

    const existingEvents = await this.prisma.event.findMany({
        where: {
            OR: events.map((entry) => ({
                userId: entry.userId,
                type: entry.type,
                timestamp: entry.timestamp,
            })),
        },
    });

    chai.expect(existingEvents).to.have.lengthOf(
        events.length,
        'The number of events found does not match the expected number'
    );
});
