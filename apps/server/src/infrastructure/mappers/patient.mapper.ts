import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Patient, PatientId} from '../../domain/patient/entities';
import {MapperWithoutDto} from './mapper';
import { ProfessionalId } from '../../domain/professional/entities';
import { DocumentId } from '../../domain/@shared/value-objects';

export type PatientModel = PrismaClient.Patient;

@Injectable()
export class PatientMapper extends MapperWithoutDto<Patient, PatientModel> {
    toDomain(model: PatientModel): Patient {
        return new Patient({
            ...model,
            id: PatientId.from(model.id),
            professionalId: model.professionalId ? ProfessionalId.from(model.professionalId) : null,
            documentId: DocumentId.create(model.documentId),
        });
    }

    toPersistence(entity: Patient): PatientModel {
        return {
            id: entity.id.toString(),
            professionalId: entity.professionalId?.toString() ?? null,
            documentId: entity.documentId.toString(),
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
