import {randomBytes, randomUUID} from 'node:crypto';
import {Inject, Injectable} from '@nestjs/common';
import type {PatientCallEntry as PrismaEntry, Prisma} from '@prisma/client';
import {PreconditionException} from '@domain/@shared/exceptions';
import type {AppointmentId} from '@domain/appointment/entities';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {PatientCallIdentity, PatientCallPanel} from '@domain/patient-call/patient-call.repository';
import {
    defaultPatientCallIdentity,
    PatientCallEntry,
    PatientCallQueueItem,
    PatientCallRepository,
    PublicPatientCallPanel,
} from '@domain/patient-call/patient-call.repository';
import type {PatientId} from '@domain/patient/entities';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

const recentCallLimit = 5;
const recentCallWindowMs = 30 * 60 * 1000;
const patientNameSelect = {patient: {select: {person: {select: {name: true}}}}} satisfies Prisma.AppointmentSelect;
const publicCallSelect = {
    appointmentId: true,
    destination: true,
    expiresAt: true,
    entry: {select: {appointment: {select: patientNameSelect}}},
} satisfies Prisma.PatientCallAnnouncementSelect;

function toPublicCall(call: Prisma.PatientCallAnnouncementGetPayload<{select: typeof publicCallSelect}>) {
    return {patientName: call.entry.appointment.patient.person.name, destination: call.destination};
}

const eligibleAppointment = {
    status: 'ARRIVED',
    deletedAt: null,
    patient: {deletedAt: null},
} satisfies Prisma.AppointmentWhereInput;

function toEntry(row: PrismaEntry): PatientCallEntry {
    return {
        appointmentId: row.appointmentId,
        arrivedAt: row.arrivedAt,
        callCount: row.callCount,
        destination: row.destination,
    };
}

function publicLogo(value: string | null): string | null {
    if (value === null) return null;

    try {
        const url = new URL(value);

        return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch {
        return null;
    }
}

@Injectable()
export class PatientCallPrismaRepository extends PrismaRepository implements PatientCallRepository {
    constructor(@Inject(PrismaProvider) prismaProvider: PrismaProvider) {
        super(prismaProvider);
    }

    async isEnabled(clinicId: ClinicId): Promise<boolean> {
        const panel = await this.prisma.patientCallPanel.findFirst({
            where: {clinicId: clinicId.toString(), enabledAt: {not: null}},
            select: {clinicId: true},
        });

        return panel !== null;
    }

    async getPanel(clinicId: ClinicId): Promise<PatientCallPanel> {
        const clinic = await this.prisma.clinic.findFirst({
            where: {id: clinicId.toString(), deletedAt: null},
            select: {logoUrl: true, patientCallPanel: true},
        });
        const panel = clinic?.patientCallPanel ?? null;
        const identity = panel ?? defaultPatientCallIdentity;

        return {
            title: identity.title,
            message: identity.message,
            foregroundColor: identity.foregroundColor,
            backgroundColor: identity.backgroundColor,
            useClinicLogo: identity.useClinicLogo,
            soundEnabled: identity.soundEnabled,
            showRecentCalls: identity.showRecentCalls,
            displaySeconds: identity.displaySeconds,
            clinicLogoUrl: publicLogo(clinic?.logoUrl ?? null),
            enabled: panel !== null && panel.enabledAt !== null,
            publicToken: panel?.publicToken ?? null,
        };
    }

    async savePanel(clinicId: ClinicId, identity: PatientCallIdentity): Promise<PatientCallPanel> {
        const id = clinicId.toString();

        await this.prisma.patientCallPanel.upsert({
            where: {clinicId: id},
            create: {clinicId: id, ...identity},
            update: identity,
        });

        return this.getPanel(clinicId);
    }

    async publishPanel(clinicId: ClinicId): Promise<PatientCallPanel> {
        const id = clinicId.toString();
        const publicToken = randomBytes(32).toString('hex');
        const enabledAt = new Date();

        await this.prisma.patientCallPanel.upsert({
            where: {clinicId: id},
            create: {clinicId: id, ...defaultPatientCallIdentity, enabledAt, publicToken},
            update: {enabledAt, publicToken},
        });

        return this.getPanel(clinicId);
    }

    async revokePanel(clinicId: ClinicId): Promise<PatientCallPanel> {
        await this.prisma.patientCallPanel.updateMany({
            where: {clinicId: clinicId.toString()},
            data: {publicToken: null},
        });

        return this.getPanel(clinicId);
    }

    async getPublicPanel(token: string): Promise<PublicPatientCallPanel | null> {
        const panel = await this.prisma.patientCallPanel.findFirst({
            where: {publicToken: token, clinic: {deletedAt: null}},
            select: {
                clinicId: true,
                title: true,
                message: true,
                foregroundColor: true,
                backgroundColor: true,
                useClinicLogo: true,
                soundEnabled: true,
                showRecentCalls: true,
                clinic: {select: {logoUrl: true}},
            },
        });

        if (panel === null) return null;

        const now = new Date();
        const visibleCalls: Prisma.PatientCallAnnouncementWhereInput = {
            clinicId: panel.clinicId,
            visibleFrom: {lte: now},
            entry: {
                clinicId: panel.clinicId,
                removalReason: null,
                appointment: {
                    clinicId: panel.clinicId,
                    deletedAt: null,
                    status: {notIn: ['CANCELLED', 'NO_SHOW']},
                    patient: {clinicId: panel.clinicId, deletedAt: null, person: {deletedAt: null}},
                },
            },
        };
        const announcement = await this.prisma.patientCallAnnouncement.findFirst({
            where: {...visibleCalls, expiresAt: {gt: now}},
            orderBy: {visibleFrom: 'desc'},
            select: publicCallSelect,
        });
        const recentCalls = panel.showRecentCalls
            ? await this.prisma.patientCallAnnouncement.findMany({
                  where: {
                      ...visibleCalls,
                      expiresAt: {lte: now, gt: new Date(now.getTime() - recentCallWindowMs)},
                      appointmentId: announcement ? {not: announcement.appointmentId} : undefined,
                  },
                  orderBy: {visibleFrom: 'desc'},
                  distinct: ['appointmentId'],
                  take: recentCallLimit,
                  select: publicCallSelect,
              })
            : [];

        return {
            title: panel.title,
            message: panel.message,
            foregroundColor: panel.foregroundColor,
            backgroundColor: panel.backgroundColor,
            soundEnabled: panel.soundEnabled,
            logoUrl: panel.useClinicLogo ? publicLogo(panel.clinic.logoUrl) : null,
            call: announcement && {
                ...toPublicCall(announcement),
                expiresAt: announcement.expiresAt,
            },
            recentCalls: recentCalls.map(toPublicCall),
        };
    }

    async listQueue(clinicId: ClinicId, patientIds: PatientId[] | null): Promise<PatientCallQueueItem[]> {
        const rows = await this.prisma.patientCallEntry.findMany({
            where: {
                clinicId: clinicId.toString(),
                closedAt: null,
                appointment: {
                    clinicId: clinicId.toString(),
                    ...eligibleAppointment,
                    patientId: patientIds === null ? undefined : {in: patientIds.map((id) => id.toString())},
                },
            },
            orderBy: [{arrivedAt: 'asc'}, {appointmentId: 'asc'}],
            include: {appointment: {select: patientNameSelect}},
        });

        return rows.map((row) => ({...toEntry(row), patientName: row.appointment.patient.person.name}));
    }

    async lockAppointment(clinicId: ClinicId, appointmentId: AppointmentId): Promise<void> {
        await this.prisma.$queryRaw`
            SELECT id FROM appointment
            WHERE id = ${appointmentId.toString()}::uuid AND clinic_id = ${clinicId.toString()}::uuid
            FOR UPDATE
        `;
    }

    async joinQueue(clinicId: ClinicId, appointmentId: AppointmentId, arrivedAt: Date): Promise<boolean> {
        if (!(await this.isEnabled(clinicId))) return false;

        const entry = await this.prisma.patientCallEntry.upsert({
            where: {appointmentId: appointmentId.toString(), clinicId: clinicId.toString()},
            create: {clinicId: clinicId.toString(), appointmentId: appointmentId.toString(), arrivedAt},
            update: {},
            select: {closedAt: true},
        });

        return entry.closedAt === null;
    }

    async findEntry(clinicId: ClinicId, appointmentId: AppointmentId): Promise<PatientCallEntry | null> {
        const row = await this.prisma.patientCallEntry.findFirst({
            where: {clinicId: clinicId.toString(), appointmentId: appointmentId.toString(), closedAt: null},
        });

        return row === null ? null : toEntry(row);
    }

    async announce(
        clinicId: ClinicId,
        appointmentId: AppointmentId,
        actorMemberId: ClinicMemberId,
        destination: string
    ): Promise<PatientCallEntry> {
        const id = clinicId.toString();

        // Serialize display reservations across operators, including calls for different appointments.
        await this.prisma.$queryRaw`SELECT clinic_id FROM patient_call_panel WHERE clinic_id = ${id}::uuid FOR UPDATE`;
        const panel = await this.prisma.patientCallPanel.findUnique({
            where: {clinicId: id},
            select: {publicToken: true, displaySeconds: true},
        });

        if (panel?.publicToken == null) throw new PreconditionException('Patient call display is unavailable.');

        const now = new Date();
        const previous = await this.prisma.patientCallAnnouncement.findFirst({
            where: {clinicId: id, expiresAt: {gt: now}, entry: {removalReason: null}},
            orderBy: {visibleFrom: 'desc'},
            select: {expiresAt: true},
        });
        const visibleFrom = previous?.expiresAt ?? now;
        const expiresAt = new Date(visibleFrom.getTime() + panel.displaySeconds * 1000);
        const row = await this.prisma.patientCallEntry.update({
            where: {appointmentId: appointmentId.toString(), clinicId: id},
            data: {destination, callCount: {increment: 1}},
        });

        await this.prisma.patientCallAnnouncement.create({
            data: {
                id: randomUUID(),
                clinicId: id,
                appointmentId: row.appointmentId,
                actorMemberId: actorMemberId.toString(),
                destination,
                announcedAt: now,
                visibleFrom,
                expiresAt,
            },
        });

        return toEntry(row);
    }

    async remove(
        clinicId: ClinicId,
        appointmentId: AppointmentId,
        actorMemberId: ClinicMemberId,
        reason: string
    ): Promise<void> {
        await this.prisma.patientCallEntry.update({
            where: {appointmentId: appointmentId.toString(), clinicId: clinicId.toString()},
            data: {closedAt: new Date(), removalReason: reason, removedByMemberId: actorMemberId.toString()},
        });
    }
}
