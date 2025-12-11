import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {AppointmentRepository} from '../../domain/appointment/appointment.repository';
import {Appointment, AppointmentId} from '../../domain/appointment/entities';
import {AppointmentMapper} from '../mappers/appointment.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

export type AppointmentModel = PrismaClient.Appointment;

@Injectable()
export class AppointmentPrismaRepository extends PrismaRepository implements AppointmentRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: AppointmentMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: AppointmentId): Promise<Appointment | null> {
        const appointment = await this.prisma.appointment.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return appointment === null ? null : this.mapper.toDomain(appointment);
    }

    async delete(id: AppointmentId): Promise<void> {
        await this.prisma.appointment.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
