import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import {ClinicLicense, ClinicLicenseId, type ModuleSeats} from '@domain/clinic-license/entities';
import {ModuleType} from '@domain/clinic-license/models';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type ClinicLicenseModel = PrismaClient.ClinicLicense & {
    modules: PrismaClient.ClinicLicenseModule[];
    assignments: PrismaClient.ClinicModuleAssignment[];
};

export type ClinicLicenseWriteModel = {
    license: PrismaClient.ClinicLicense;
    modules: Array<Omit<PrismaClient.ClinicLicenseModule, 'id'>>;
    assignments: Array<Omit<PrismaClient.ClinicModuleAssignment, 'id'>>;
};

@Injectable()
export class ClinicLicenseMapper extends MapperWithoutDto<ClinicLicense, ClinicLicenseModel, ClinicLicenseWriteModel> {
    toDomain(model: ClinicLicenseModel): ClinicLicense {
        return new ClinicLicense({
            id: ClinicLicenseId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            includedProfessionals: model.includedProfessionals,
            extraProfessionals: model.extraProfessionals,
            maxProfessionals: model.maxProfessionals,
            modules: new Map<ModuleType, ModuleSeats>(
                model.modules.map((module) => [
                    toEnum(ModuleType, module.moduleType),
                    {includedSeats: module.includedSeats, extraSeats: module.extraSeats, maxSeats: module.maxSeats},
                ])
            ),
            assignments: model.assignments.map((assignment) => ({
                moduleType: toEnum(ModuleType, assignment.moduleType),
                clinicMemberId: ClinicMemberId.from(assignment.clinicMemberId),
                assignedAt: assignment.assignedAt,
            })),
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }

    toPersistence(entity: ClinicLicense): ClinicLicenseWriteModel {
        const licenseId = entity.id.toString();

        return {
            license: {
                id: licenseId,
                clinicId: entity.clinicId.toString(),
                includedProfessionals: entity.includedProfessionals,
                extraProfessionals: entity.extraProfessionals,
                maxProfessionals: entity.maxProfessionals,
                createdAt: entity.createdAt,
                updatedAt: entity.updatedAt,
            },
            modules: [...entity.modules].map(([type, seats]) => ({
                licenseId,
                moduleType: toEnum(PrismaClient.ClinicModuleType, type),
                includedSeats: seats.includedSeats,
                extraSeats: seats.extraSeats,
                maxSeats: seats.maxSeats,
            })),
            assignments: entity.assignments.map((assignment) => ({
                licenseId,
                clinicMemberId: assignment.clinicMemberId.toString(),
                moduleType: toEnum(PrismaClient.ClinicModuleType, assignment.moduleType),
                assignedAt: assignment.assignedAt,
            })),
        };
    }
}
