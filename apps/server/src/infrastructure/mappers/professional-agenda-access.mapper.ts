import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {ProfessionalAgendaAccess, ProfessionalAgendaAccessId} from '@domain/professional-agenda-access/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type ProfessionalAgendaAccessModel = PrismaClient.ProfessionalAgendaAccess;

@Injectable()
export class ProfessionalAgendaAccessMapper extends MapperWithoutDto<
    ProfessionalAgendaAccess,
    ProfessionalAgendaAccessModel
> {
    toDomain(model: ProfessionalAgendaAccessModel): ProfessionalAgendaAccess {
        return new ProfessionalAgendaAccess({
            id: ProfessionalAgendaAccessId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            granteeMemberId: ClinicMemberId.from(model.granteeMemberId),
            professionalMemberId: ClinicMemberId.from(model.professionalMemberId),
            reason: model.reason,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: ProfessionalAgendaAccess): ProfessionalAgendaAccessModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            granteeMemberId: entity.granteeMemberId.toString(),
            professionalMemberId: entity.professionalMemberId.toString(),
            reason: entity.reason,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
