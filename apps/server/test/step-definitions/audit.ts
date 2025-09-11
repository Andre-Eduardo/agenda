import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Then, Given} from '@cucumber/cucumber';
import {AuditRepository} from '../../src/domain/audit/audit.repository';
import {AuditEndReasonType, Audit} from '../../src/domain/audit/entities';
import {RoomStatusId} from '../../src/domain/room-status/entities';
import {UserId} from '../../src/domain/user/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type AuditEntry = {
    companyId?: string;
    roomNumber?: number;
    startedById?: string;
    finishedById?: string;
    reason?: string;
    endReason?: keyof typeof AuditEndReasonType | null;
    note?: string;
    startedAt?: string;
    finishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
};

const auditHeaderMap: Record<string, keyof AuditEntry> = {
    'Company ID': 'companyId',
    'Room number': 'roomNumber',
    'Start user ID': 'startedById',
    'End user ID': 'finishedById',
    Reason: 'reason',
    'End reason': 'endReason',
    Note: 'note',
    'Started at': 'startedAt',
    'Finished at': 'finishedAt',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following audits exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const audits = multipleEntries<AuditEntry>(this, table, auditHeaderMap);

        for (const entry of audits) {
            await createAudit(this, companyName, entry.roomNumber ?? randomInt(1, 1000), entry.startedById, entry);
        }
    }
);

async function createAudit(
    context: Context,
    company: string,
    roomNumber: number,
    startedById: string | undefined,
    entry: AuditEntry
): Promise<void> {
    const roomId = context.variables.ids.companyScope.room[company][roomNumber];

    if (roomId == null) {
        throw new Error(`The room ${roomNumber} must be created before creating an audit.`);
    }

    const audit = new Audit({
        id: RoomStatusId.generate(),
        companyId: context.variables.ids.company[company],
        roomId,
        startedById: startedById ? UserId.from(startedById) : UserId.generate(),
        finishedById: entry.finishedById ? UserId.from(entry.finishedById) : null,
        reason: entry.reason ?? 'a',
        endReason:
            entry.endReason !== undefined && entry.endReason !== null ? AuditEndReasonType[entry.endReason] : null,
        note: entry.note ?? null,
        startedAt: entry.startedAt ? new Date(entry.startedAt) : new Date(),
        finishedAt: entry.finishedAt ? new Date(entry.finishedAt) : null,
        createdAt: new Date(entry.createdAt ?? Date.now()),
        updatedAt: new Date(entry.updatedAt ?? Date.now()),
    });

    await repository(context).save(audit);

    context.setVariableId('audit', roomNumber, audit.id, company);
}

Then(
    'should exist audits in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const audits = multipleEntries<AuditEntry>(this, table, auditHeaderMap);

        const existingAudits = await this.prisma.audit.findMany({
            where: {
                OR: audits.map((entry) => ({
                    reason: entry.reason,
                    endReason: entry.endReason,
                    note: entry.note,
                    roomStatus: {
                        finishedAt: entry.finishedAt,
                        startedById: entry.startedById,
                        finishedById: entry.finishedById,
                        startedAt: entry.startedAt,
                        company: {
                            name: company,
                        },
                        room: {
                            number: entry.roomNumber,
                        },
                        createdAt: entry.createdAt ? new Date(entry.createdAt) : undefined,
                        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : undefined,
                    },
                })),
            },
        });

        chai.expect(existingAudits).to.have.lengthOf(
            audits.length,
            'The number of audits found does not match the expected number'
        );
    }
);

function repository(context: Context) {
    return context.app.get(AuditRepository);
}
