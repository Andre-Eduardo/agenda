import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Appointment, AppointmentId} from '../../domain/appointment/entities';
import {AppointmentRepository} from '../../domain/appointment/appointment.repository';
import {AppointmentMapper} from '../mappers/appointment.mapper';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';
import { PrismaProvider } from './prisma/prisma.provider';

export type AppointmentModel = PrismaClient.Appointment;

@Injectable()
export class AppointmentPrismaRepository extends PrismaRepository implements AppointmentRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: AppointmentMapper,
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
