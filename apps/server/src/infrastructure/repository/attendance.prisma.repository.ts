import {Inject, Injectable} from '@nestjs/common';
import type {AppointmentTriage as PrismaTriage, Prisma} from '@prisma/client';
import type {AppointmentId} from '@domain/appointment/entities';
import {
    type AppointmentTriage,
    type AttendanceFilter,
    type AttendanceItem,
    AttendanceRepository,
    type TriageMeasurements,
} from '@domain/attendance/attendance.repository';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

const suggestionSelect = {
    room: {select: {name: true, deletedAt: true, active: true}},
    attendedBy: {
        select: {professional: {select: {defaultRoom: {select: {name: true, deletedAt: true, active: true}}}}},
    },
} satisfies Prisma.AppointmentSelect;

type SuggestionSource = Prisma.AppointmentGetPayload<{select: typeof suggestionSelect}>;
type RoomRef = {name: string; deletedAt: Date | null; active: boolean} | null;

function usableRoom(room: RoomRef): string | null {
    return room !== null && room.deletedAt === null && room.active ? room.name : null;
}

function toSuggestion(source: SuggestionSource): string | null {
    return usableRoom(source.room) ?? usableRoom(source.attendedBy.professional?.defaultRoom ?? null);
}

function decimal(value: Prisma.Decimal | null): number | null {
    return value === null ? null : value.toNumber();
}

function toTriage(row: PrismaTriage): AppointmentTriage {
    return {
        appointmentId: row.appointmentId,
        weightKg: decimal(row.weightKg),
        heightCm: row.heightCm,
        systolicPressure: row.systolicPressure,
        diastolicPressure: row.diastolicPressure,
        heartRate: row.heartRate,
        temperatureCelsius: decimal(row.temperatureCelsius),
        oxygenSaturation: row.oxygenSaturation,
        notes: row.notes,
        releasedAt: row.releasedAt,
        releasedByMemberId: row.releasedByMemberId,
        updatedAt: row.updatedAt,
    };
}

@Injectable()
export class AttendancePrismaRepository extends PrismaRepository implements AttendanceRepository {
    constructor(@Inject(PrismaProvider) prismaProvider: PrismaProvider) {
        super(prismaProvider);
    }

    async list(clinicId: ClinicId, filter: AttendanceFilter): Promise<AttendanceItem[]> {
        const id = clinicId.toString();
        const rows = await this.prisma.appointment.findMany({
            where: {
                clinicId: id,
                deletedAt: null,
                status: {in: ['ARRIVED', 'IN_PROGRESS']},
                startAt: {gte: filter.from, lte: filter.to},
                patient: {deletedAt: null},
                attendedByMemberId:
                    filter.attendedByMemberIds === null
                        ? undefined
                        : {in: filter.attendedByMemberIds.map((memberId) => memberId.toString())},
            },
            orderBy: [{arrivedAt: 'asc'}, {startAt: 'asc'}, {id: 'asc'}],
            select: {
                id: true,
                patientId: true,
                attendedByMemberId: true,
                startAt: true,
                arrivedAt: true,
                calledAt: true,
                status: true,
                patient: {select: {person: {select: {name: true}}}},
                patientCallEntry: {select: {callCount: true, destination: true}},
                triage: {select: {releasedAt: true}},
                ...suggestionSelect,
            },
        });

        return rows.flatMap((row): AttendanceItem[] => {
            if (row.status !== 'ARRIVED' && row.status !== 'IN_PROGRESS') return [];

            return [
                {
                    appointmentId: row.id,
                    patientId: row.patientId,
                    patientName: row.patient.person.name,
                    attendedByMemberId: row.attendedByMemberId,
                    startAt: row.startAt,
                    arrivedAt: row.arrivedAt,
                    calledAt: row.calledAt,
                    status: row.status,
                    destination: row.patientCallEntry?.destination ?? null,
                    callCount: row.patientCallEntry?.callCount ?? 0,
                    triageStarted: row.triage !== null,
                    triageReleasedAt: row.triage?.releasedAt ?? null,
                    suggestedDestination: toSuggestion(row),
                },
            ];
        });
    }

    async findTriage(clinicId: ClinicId, appointmentId: AppointmentId): Promise<AppointmentTriage | null> {
        const row = await this.prisma.appointmentTriage.findFirst({
            where: {clinicId: clinicId.toString(), appointmentId: appointmentId.toString()},
        });

        return row === null ? null : toTriage(row);
    }

    async saveTriage(
        clinicId: ClinicId,
        appointmentId: AppointmentId,
        actorMemberId: ClinicMemberId,
        measurements: TriageMeasurements,
        release: boolean
    ): Promise<AppointmentTriage> {
        const now = new Date();
        const current = await this.findTriage(clinicId, appointmentId);
        // Liberar é definitivo: salvar de novo os dados não desfaz a liberação.
        const releasedAt = current?.releasedAt ?? (release ? now : null);
        const releasedByMemberId = current?.releasedByMemberId ?? (release ? actorMemberId.toString() : null);
        const data = {
            ...measurements,
            releasedAt,
            releasedByMemberId,
            updatedByMemberId: actorMemberId.toString(),
            updatedAt: now,
        };
        const row = await this.prisma.appointmentTriage.upsert({
            where: {appointmentId: appointmentId.toString()},
            create: {
                ...data,
                appointmentId: appointmentId.toString(),
                clinicId: clinicId.toString(),
                createdAt: now,
            },
            update: data,
        });

        return toTriage(row);
    }

    async suggestedDestination(clinicId: ClinicId, appointmentId: AppointmentId): Promise<string | null> {
        const row = await this.prisma.appointment.findFirst({
            where: {id: appointmentId.toString(), clinicId: clinicId.toString()},
            select: suggestionSelect,
        });

        return row === null ? null : toSuggestion(row);
    }
}
