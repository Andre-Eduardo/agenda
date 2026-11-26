import {Injectable} from '@nestjs/common';
import type {Procedure as ProcedureModel} from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import {ClinicId} from '@domain/clinic/entities';
import {Procedure, ProcedureColor, ProcedureId, ProcedureModality} from '@domain/procedure/procedure.entity';
import {ProcedureRepository} from '@domain/procedure/procedure.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class ProcedurePrismaRepository implements ProcedureRepository {
    constructor(private readonly prismaProvider: PrismaProvider) {}

    async list(clinicId: ClinicId, includeInactive: boolean): Promise<Procedure[]> {
        const rows = await this.prismaProvider.client.procedure.findMany({
            where: {clinicId: clinicId.toString(), active: includeInactive ? undefined : true},
            orderBy: [{active: 'desc'}, {name: 'asc'}, {id: 'asc'}],
        });

        return rows.map(toDomain);
    }

    async findActive(clinicId: ClinicId, id: ProcedureId): Promise<Procedure | null> {
        const row = await this.prismaProvider.client.procedure.findFirst({
            where: {id: id.toString(), clinicId: clinicId.toString(), active: true},
        });

        return row === null ? null : toDomain(row);
    }

    async create({id, clinicId, ...details}: Procedure): Promise<Procedure> {
        const row = await this.prismaProvider.client.procedure.create({
            data: {...details, id: id.toString(), clinicId: clinicId.toString()},
        });

        return toDomain(row);
    }

    async update({id, clinicId, ...details}: Procedure): Promise<Procedure | null> {
        const [row] = await this.prismaProvider.client.procedure.updateManyAndReturn({
            where: {id: id.toString(), clinicId: clinicId.toString()},
            data: details,
        });

        return row === undefined ? null : toDomain(row);
    }
}

function toDomain(row: ProcedureModel): Procedure {
    return {
        ...row,
        id: ProcedureId.from(row.id),
        clinicId: ClinicId.from(row.clinicId),
        color: toEnum(ProcedureColor, row.color),
        modality: toEnum(ProcedureModality, row.modality),
    };
}
