import {Injectable} from '@nestjs/common';
import type {ApplicationService, Command} from '@application/@shared/application.service';
import {AppointmentReportDto, type GetAppointmentReportDto} from '@application/clinic-report/dtos';
import {
    buildAppointmentReport,
    isValidTimeZone,
    type AppointmentReportRow,
} from '@application/clinic-report/services/appointment-report.builder';
import {InvalidInputException} from '@domain/@shared/exceptions';
import {toEnum} from '@domain/@shared/utils';
import {AppointmentStatus, AppointmentType} from '@domain/appointment/entities';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

/** Longest period one report may cover, to keep the read bounded. */
export const MAX_REPORT_DAYS = 366;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Operational appointment report of the actor's clinic: volume, outcomes (attendance, no-show,
 * cancellation), per professional, procedure, day, weekday and hour. Read-only projection, like
 * the financial report; it never changes an appointment.
 */
@Injectable()
export class GetAppointmentReportService implements ApplicationService<GetAppointmentReportDto, AppointmentReportDto> {
    constructor(private readonly prismaProvider: PrismaProvider) {}

    private get prisma() {
        return this.prismaProvider.client;
    }

    async execute({actor, payload}: Command<GetAppointmentReportDto>): Promise<AppointmentReportDto> {
        const {startDate, professionalMemberId} = payload;
        const endDate = inclusiveEnd(payload.endDate);
        const timeZone = payload.timeZone ?? 'UTC';

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
            throw new InvalidInputException('Invalid date range');
        }

        if (endDate.getTime() - startDate.getTime() > MAX_REPORT_DAYS * DAY_MS) {
            throw new InvalidInputException(`The report period cannot exceed ${MAX_REPORT_DAYS} days`);
        }

        if (!isValidTimeZone(timeZone)) {
            throw new InvalidInputException('Invalid time zone');
        }

        const clinicId = actor.clinicId.toString();
        const appointments = await this.prisma.appointment.findMany({
            where: {
                clinicId,
                startAt: {gte: startDate, lte: endDate},
                attendedByMemberId: professionalMemberId,
                deletedAt: null,
                patient: {deletedAt: null},
            },
            select: {
                status: true,
                type: true,
                startAt: true,
                durationMinutes: true,
                attendedByMemberId: true,
                attendedBy: {select: {displayName: true, user: {select: {name: true}}}},
                patientId: true,
                procedureName: true,
                arrivedAt: true,
                calledAt: true,
            },
            orderBy: [{startAt: 'asc'}, {id: 'asc'}],
        });

        const rows: AppointmentReportRow[] = appointments.map((appointment) => ({
            status: toEnum(AppointmentStatus, appointment.status),
            type: toEnum(AppointmentType, appointment.type),
            startAt: appointment.startAt,
            durationMinutes: appointment.durationMinutes,
            attendedByMemberId: appointment.attendedByMemberId,
            professionalName: appointment.attendedBy.displayName ?? appointment.attendedBy.user.name,
            patientId: appointment.patientId,
            procedureName: appointment.procedureName,
            arrivedAt: appointment.arrivedAt,
            calledAt: appointment.calledAt,
        }));

        const patientIds = [...new Set(rows.map((row) => row.patientId))];
        const firstAppointments =
            patientIds.length === 0
                ? []
                : await this.prisma.appointment.groupBy({
                      by: ['patientId'],
                      where: {clinicId, patientId: {in: patientIds}, deletedAt: null},
                      _min: {startAt: true},
                  });
        const firstAppointmentByPatient = new Map<string, Date>();

        for (const entry of firstAppointments) {
            if (entry._min.startAt !== null) firstAppointmentByPatient.set(entry.patientId, entry._min.startAt);
        }

        return new AppointmentReportDto(
            buildAppointmentReport({
                startDate,
                endDate,
                timeZone,
                professionalMemberId,
                rows,
                firstAppointmentByPatient,
            })
        );
    }
}

/** A bare date (no time) as end of the period covers that whole day. */
function inclusiveEnd(date: Date): Date {
    const isMidnight =
        date.getUTCHours() === 0 &&
        date.getUTCMinutes() === 0 &&
        date.getUTCSeconds() === 0 &&
        date.getUTCMilliseconds() === 0;

    if (!isMidnight) return date;

    return new Date(date.getTime() + DAY_MS - 1);
}
