import { Injectable } from "@nestjs/common";
import PrismaClient from "@prisma/client";
import { ProfessionalDto } from "@application/professional/dtos/professional.dto";
import { toEnumOrNull } from "@domain/@shared/utils";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { Professional, ProfessionalId } from "@domain/professional/entities";
import { AiSpecialtyGroup } from "@domain/form-template/entities";
import { MapperWithDto } from "@infrastructure/mappers/mapper";

export type ProfessionalReadModel = PrismaClient.Professional;
export type ProfessionalWriteModel = PrismaClient.Professional;

@Injectable()
export class ProfessionalMapper extends MapperWithDto<
  Professional,
  ProfessionalReadModel,
  ProfessionalDto,
  ProfessionalWriteModel
> {
  toDomain(model: ProfessionalReadModel): Professional {
    return new Professional({
      id: ProfessionalId.from(model.id),
      clinicMemberId: ClinicMemberId.from(model.clinicMemberId),
      registrationNumber: model.registrationNumber,
      specialty: model.specialty,
      specialtyNormalized: toEnumOrNull(AiSpecialtyGroup, model.specialtyNormalized),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt ?? null,
    });
  }

  toPersistence(entity: Professional): ProfessionalWriteModel {
    return {
      id: entity.id.toString(),
      clinicMemberId: entity.clinicMemberId.toString(),
      registrationNumber: entity.registrationNumber,
      specialty: entity.specialty,
      specialtyNormalized: toEnumOrNull(PrismaClient.AiSpecialtyGroup, entity.specialtyNormalized),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  toDto(entity: Professional): ProfessionalDto {
    return new ProfessionalDto(entity);
  }
}
