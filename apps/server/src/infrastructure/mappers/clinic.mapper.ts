import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {DocumentId, Email, Phone} from '../../domain/@shared/value-objects';
import {Clinic, ClinicId} from '../../domain/clinic/entities';
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
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
