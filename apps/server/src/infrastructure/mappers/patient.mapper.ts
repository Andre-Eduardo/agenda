import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {DocumentId} from '../../domain/@shared/value-objects';
import {Patient, PatientId} from '../../domain/patient/entities';
import {Gender, PersonType} from '../../domain/person/entities'; // Verify this path
import {ProfessionalId} from '../../domain/professional/entities';
import {MapperWithoutDto} from './mapper';

export type PatientModel = PrismaClient.Patient & {person: PrismaClient.Person};

@Injectable()
export class PatientMapper extends MapperWithoutDto<Patient, PatientModel> {
    toDomain(model: PatientModel): Patient {
        const {person, ...patientModel} = model;

        return new Patient({
            ...patientModel,
            ...person,
            id: PatientId.from(patientModel.id),
            professionalId: patientModel.professionalId ? ProfessionalId.from(patientModel.professionalId) : null,
            documentId: DocumentId.create(patientModel.documentId),
            // Explicit casting or mapping for enums if names match
            gender: person.gender ? (person.gender as unknown as Gender) : null,
            personType: person.personType as unknown as PersonType,
            phone: person.phone ? ({number: person.phone} as any) : null,
        });
    }

    toPersistence(entity: Patient): PatientModel {
        return {
            id: entity.id.toString(),
            professionalId: entity.professionalId?.toString() ?? null,
            documentId: entity.documentId.toString(),
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            person: {
                id: entity.id.toString(),
                name: entity.name,
                documentId: entity.documentId.toString(),
                phone: entity.phone?.toString() ?? null, // Phone VO toString returns value
                gender: entity.gender ? (entity.gender as unknown as PrismaClient.Gender) : null,
                personType: entity.personType as unknown as PrismaClient.PersonType,
                createdAt: entity.createdAt,
                updatedAt: entity.updatedAt,
            },
        };
    }
}
