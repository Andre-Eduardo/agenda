import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnumArray} from '../../domain/@shared/utils';
import {DocumentId, Email, Phone} from '../../domain/@shared/value-objects';
import {Clinic, ClinicId} from '../../domain/clinic/entities';
import {Specialty} from '../../domain/form-template/entities';
import {MapperWithoutDto} from './mapper';

export type ClinicModel = PrismaClient.Clinic;

@Injectable()
export class ClinicMapper extends MapperWithoutDto<Clinic, ClinicModel> {
    toDomain(model: ClinicModel): Clinic {
        return new Clinic({
            id: ClinicId.from(model.id),
            name: model.name,
            documentId: model.documentId === null ? null : DocumentId.create(model.documentId),
            phone: model.phone === null ? null : Phone.create(model.phone),
            email: model.email === null ? null : Email.create(model.email),
            isPersonalClinic: model.isPersonalClinic,
            street: model.street ?? null,
            number: model.number ?? null,
            complement: model.complement ?? null,
            neighborhood: model.neighborhood ?? null,
            city: model.city ?? null,
            state: model.state ?? null,
            zipCode: model.zipCode ?? null,
            country: model.country ?? null,
            logoUrl: model.logoUrl ?? null,
            clinicSpecialties: toEnumArray(Specialty, model.clinicSpecialties),
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: Clinic): ClinicModel {
        return {
            id: entity.id.toString(),
            name: entity.name,
            documentId: entity.documentId?.toString() ?? null,
            phone: entity.phone?.toString() ?? null,
            email: entity.email?.toString() ?? null,
            isPersonalClinic: entity.isPersonalClinic,
            street: entity.street,
            number: entity.number,
            complement: entity.complement,
            neighborhood: entity.neighborhood,
            city: entity.city,
            state: entity.state,
            zipCode: entity.zipCode,
            country: entity.country,
            logoUrl: entity.logoUrl,
            clinicSpecialties: entity.clinicSpecialties as PrismaClient.Specialty[],
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
