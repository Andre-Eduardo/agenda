import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Appointment, AppointmentId} from '../../domain/appointment/entities';
import {AppointmentRepository} from '../../domain/appointment/appointment.repository';
import {PatientId} from '../../domain/patient/entities';
import {ProfessionalId} from '../../domain/professional/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type AppointmentModel = PrismaClient.Appointment;

@Injectable()
export class AppointmentPrismaRepository extends PrismaRepository implements AppointmentRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(appointment: AppointmentModel): Appointment {
        return new Appointment({
            ...appointment,
            id: AppointmentId.from(appointment.id),
            patientId: PatientId.from(appointment.patientId),
            professionalId: ProfessionalId.from(appointment.professionalId),
            canceledAt: appointment.canceledAt ?? null,
            canceledReason: appointment.canceledReason ?? null,
            note: appointment.note ?? null,
        });
    }

    async findById(id: AppointmentId): Promise<Appointment | null> {
        const appointment = await this.prisma.appointment.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return appointment === null ? null : AppointmentPrismaRepository.normalize(appointment);
    }

    async delete(id: AppointmentId): Promise<void> {
        await this.prisma.appointment.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
