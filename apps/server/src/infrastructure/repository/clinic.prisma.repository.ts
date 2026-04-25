import {Injectable} from '@nestjs/common';
import {Clinic, ClinicId} from '../../domain/clinic/entities';
import {ClinicRepository} from '../../domain/clinic/clinic.repository';
import {ClinicMapper} from '../mappers/clinic.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class ClinicPrismaRepository extends PrismaRepository implements ClinicRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: ClinicMapper,
    ) {
        super(prismaProvider);
    }

    async findById(id: ClinicId): Promise<Clinic | null> {
        const clinic = await this.prisma.clinic.findFirst({
            where: {id: id.toString()},
        });

        return clinic === null ? null : this.mapper.toDomain(clinic);
    }

    async save(clinic: Clinic): Promise<void> {
        const data = this.mapper.toPersistence(clinic);
        await this.prisma.clinic.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
