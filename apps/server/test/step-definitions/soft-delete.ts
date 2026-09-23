import {randomUUID} from 'crypto';
import {Given, Then} from '@cucumber/cucumber';
import type {PrismaService} from '../../src/infrastructure/repository/prisma';
import {chai} from '../support/chai-setup';
import type {Context} from '../support/context';

type DeletedAtRow = {deletedAt: Date | null} | null;

/**
 * One lookup per soft-deletable entity, keyed by the entity name used in the feature files (the same name
 * used to store the id variable). Reads the raw row so the assertion sees deleted rows too.
 */
const findDeletedAt = new Map<string, (prisma: PrismaService, id: string) => Promise<DeletedAtRow>>([
    ['patient', (prisma, id) => prisma.patient.findUnique({where: {id}, select: {deletedAt: true}})],
    ['person', (prisma, id) => prisma.person.findUnique({where: {id}, select: {deletedAt: true}})],
    ['record', (prisma, id) => prisma.record.findUnique({where: {id}, select: {deletedAt: true}})],
    ['appointment', (prisma, id) => prisma.appointment.findUnique({where: {id}, select: {deletedAt: true}})],
    ['user', (prisma, id) => prisma.user.findUnique({where: {id}, select: {deletedAt: true}})],
    ['clinicMember', (prisma, id) => prisma.clinicMember.findUnique({where: {id}, select: {deletedAt: true}})],
    ['professional', (prisma, id) => prisma.professional.findUnique({where: {id}, select: {deletedAt: true}})],
    ['room', (prisma, id) => prisma.room.findUnique({where: {id}, select: {deletedAt: true}})],
    ['member_block', (prisma, id) => prisma.memberBlock.findUnique({where: {id}, select: {deletedAt: true}})],
    ['working_hours', (prisma, id) => prisma.workingHours.findUnique({where: {id}, select: {deletedAt: true}})],
]);

function loadRow(world: Context, entity: string, key: string): Promise<DeletedAtRow> {
    const find = findDeletedAt.get(entity);

    if (find === undefined) {
        throw new Error(`Unknown soft-deletable entity "${entity}". Known: ${[...findDeletedAt.keys()].join(', ')}`);
    }

    return find(world.prisma, world.getVariableId(entity, key));
}

/**
 * Asserts the row still exists in the database with `deletedAt` set, i.e. it was soft-deleted rather than removed.
 *
 * Example:
 *   Then the patient "to_delete" should be soft deleted
 */
Then('the {word} {string} should be soft deleted', async function (this: Context, entity: string, key: string) {
    const row = await loadRow(this, entity, key);

    chai.expect(row, `${entity} "${key}" must still exist in the database`).to.not.equal(null);
    chai.expect(row?.deletedAt, `${entity} "${key}" must have deletedAt set`).to.be.instanceOf(Date);
});

/**
 * Asserts the row exists and was not soft-deleted. Used for data that must be retained when its parent is deleted.
 *
 * Example:
 *   Then the record "kept" should not be soft deleted
 */
Then('the {word} {string} should not be soft deleted', async function (this: Context, entity: string, key: string) {
    const row = await loadRow(this, entity, key);

    chai.expect(row, `${entity} "${key}" must still exist in the database`).to.not.equal(null);
    chai.expect(row?.deletedAt, `${entity} "${key}" must not have deletedAt set`).to.equal(null);
});

/**
 * Seeds an appointment straight in the database, so a scenario can test what happens to it without going through
 * the scheduling rules of POST /appointments.
 *
 * The appointment id is stored as `${ref:id:appointment:<key>}`.
 *
 * Example:
 *   Given an appointment "future_visit" exists for patient "p1" attended by "dr_house"
 */
Given(
    'an appointment {string} exists for patient {string} attended by {string}',
    async function (this: Context, key: string, patientKey: string, memberKey: string) {
        const id = randomUUID();
        const memberId = this.getVariableId('clinicMember', memberKey);
        const now = new Date();
        const startAt = new Date('2099-04-01T09:00:00.000Z');

        await this.prisma.appointment.create({
            data: {
                id,
                clinicId: this.getVariableId('clinic', memberKey),
                attendedByMemberId: memberId,
                createdByMemberId: memberId,
                patientId: this.getVariableId('patient', patientKey),
                startAt,
                endAt: new Date('2099-04-01T10:00:00.000Z'),
                durationMinutes: 60,
                type: 'FIRST_VISIT',
                status: 'SCHEDULED',
                createdAt: now,
                updatedAt: now,
            },
        });

        this.setVariableId('appointment', key, id);
    }
);
