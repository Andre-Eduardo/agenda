import {Inject, Injectable} from '@nestjs/common';
import type {Command} from '@application/@shared/application.service';
import {CreateProcedureDto, ProcedureDto, UpdateProcedureDto} from '@application/procedure/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ProcedureId} from '@domain/procedure/procedure.entity';
import {ProcedureRepository} from '@domain/procedure/procedure.repository';

@Injectable()
export class ProcedureCatalogService {
    constructor(@Inject(ProcedureRepository) private readonly procedures: ProcedureRepository) {}

    async list({actor, payload: includeInactive}: Command<boolean>): Promise<ProcedureDto[]> {
        const entries = await this.procedures.list(actor.clinicId, includeInactive);

        return entries.map((entry) => new ProcedureDto(entry));
    }

    async create({actor, payload}: Command<CreateProcedureDto>): Promise<ProcedureDto> {
        const entry = await this.procedures.create({
            ...payload,
            id: ProcedureId.generate(),
            clinicId: actor.clinicId,
            active: true,
        });

        return new ProcedureDto(entry);
    }

    async update({actor, payload}: Command<UpdateProcedureDto & {id: ProcedureId}>): Promise<ProcedureDto> {
        const entry = await this.procedures.update({...payload, clinicId: actor.clinicId});

        if (entry === null) {
            throw new ResourceNotFoundException('procedure.not_found', payload.id.toString());
        }

        return new ProcedureDto(entry);
    }
}
