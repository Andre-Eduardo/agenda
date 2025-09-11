import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {PersonId} from '../../src/domain/person/entities';
import {Reservation, ReservationId} from '../../src/domain/reservation/entities';
import {ReservationRepository} from '../../src/domain/reservation/reservation.repository';
import {UserId} from '../../src/domain/user/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type ReservationEntry = {
    companyId?: string;
    roomId?: string;
    roomNumber?: number;
    roomCategoryId?: string;
    roomCategoryName?: string;
    checkIn?: string;
    bookedBy?: string;
    bookedFor?: string;
    canceledAt?: string;
    canceledBy?: string;
    canceledReason?: string;
    noShow?: boolean;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
};

const reservationHeaderMap: Record<string, keyof ReservationEntry> = {
    'Company ID': 'companyId',
    'Room ID': 'roomId',
    'Room number': 'roomNumber',
    'Room category ID': 'roomCategoryId',
    'Room category name': 'roomCategoryName',
    'Check-in': 'checkIn',
    'Booked by': 'bookedBy',
    'Booked for': 'bookedFor',
    'Canceled at': 'canceledAt',
    'Canceled by': 'canceledBy',
    'Canceled reason': 'canceledReason',
    'No show': 'noShow',
    Note: 'note',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following reservations exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const reservations = multipleEntries<ReservationEntry>(this, table, reservationHeaderMap);

        for (const entry of reservations) {
            await createReservation(
                this,
                companyName,
                entry.roomNumber ?? randomInt(1, 1000),
                entry.roomCategoryName ?? `randomCategory-${randomInt(1000)}`,
                entry
            );
        }
    }
);

async function createReservation(
    context: Context,
    company: string,
    roomNumber: number,
    categoryName: string,
    entry: ReservationEntry
): Promise<void> {
    const roomId = context.variables.ids.companyScope.room[company]?.[roomNumber];
    const roomCategoryId = context.variables.ids.companyScope.roomCategory[company]?.[categoryName];

    if (roomId == null && roomCategoryId == null) {
        throw new Error(
            `The room of number ${roomNumber} or the room category ${categoryName} must be created before creating a reservation.`
        );
    }

    const tomorrow = new Date(new Date().getTime() + 24 * 3600);

    const reservation = new Reservation({
        id: ReservationId.generate(),
        companyId: context.variables.ids.company[company],
        roomId,
        roomCategoryId,
        checkIn: entry.checkIn ? new Date(entry.checkIn) : tomorrow,
        bookedBy: entry.bookedBy ? UserId.from(entry.bookedBy) : UserId.generate(),
        bookedFor: entry.bookedFor ? PersonId.from(entry.bookedFor) : PersonId.generate(),
        canceledAt: entry.canceledAt ? new Date(entry.canceledAt) : null,
        canceledBy: entry.canceledBy ? UserId.from(entry.canceledBy) : null,
        canceledReason: entry.canceledReason ?? null,
        noShow: entry.noShow ?? false,
        note: entry.note ?? null,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(reservation);

    if (roomId) {
        context.setVariableId('reservation', `room.${roomNumber}`, reservation.id, company);
    } else {
        context.setVariableId('reservation', `roomCategory.${categoryName}`, reservation.id, company);
    }
}

Then(
    'should exist reservations in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const reservations = multipleEntries<ReservationEntry>(this, table, reservationHeaderMap);

        const existingReservations = await this.prisma.reservation.findMany({
            where: {
                OR: reservations.map((entry) => ({
                    company: {
                        name: company,
                    },
                    room: {
                        id: entry.roomId ?? undefined,
                        number: entry.roomNumber ?? undefined,
                    },
                    roomCategory: {
                        id: entry.roomCategoryId ?? undefined,
                        name: entry.roomCategoryName ?? undefined,
                    },
                    checkIn: entry.checkIn,
                    bookedById: entry.bookedBy,
                    bookedForId: entry.bookedFor,
                    canceledAt: entry.canceledAt,
                    canceledById: entry.canceledBy,
                    noShow: entry.noShow,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(existingReservations).to.have.lengthOf(
            reservations.length,
            'The number of reservations found does not match the expected number'
        );
    }
);

Then(
    'the following reservations in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const reservations = multipleEntries<ReservationEntry>(this, table, reservationHeaderMap);

        const existingReservationsCount = await this.prisma.reservation.count({
            where: {
                company: {
                    name: company,
                },
            },
        });
        const foundReservations = await this.prisma.reservation.findMany({
            where: {
                OR: reservations.map((entry) => ({
                    company: {
                        name: company,
                    },
                    room: {
                        id: entry.roomId ?? undefined,
                        number: entry.roomNumber ?? undefined,
                    },
                    roomCategory: {
                        id: entry.roomCategoryId ?? undefined,
                        name: entry.roomCategoryName ?? undefined,
                    },
                    checkIn: entry.checkIn,
                    bookedById: entry.bookedBy,
                    bookedForId: entry.bookedFor,
                    canceledAt: entry.canceledAt,
                    canceledById: entry.canceledBy,
                    noShow: entry.noShow,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(foundReservations).to.have.lengthOf(
            reservations.length,
            'The number of found reservations does not match the expected number'
        );

        chai.expect(foundReservations).to.have.lengthOf(
            existingReservationsCount,
            'The number of found reservations does not match the number of existing reservations'
        );
    }
);

function repository(context: Context) {
    return context.app.get(ReservationRepository);
}
