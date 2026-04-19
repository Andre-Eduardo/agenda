import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {DocumentId, Phone} from '../../domain/@shared/value-objects';
import {toEnum, toEnumOrNull} from '../../domain/@shared/utils';
import {Patient, PatientId} from '../../domain/patient/entities';
import {Gender, PersonType, PersonProfile} from '../../domain/person/entities/person.entity';
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
            gender: toEnumOrNull(Gender, person.gender),
            personType: toEnum(PersonType, person.personType),
            phone: person.phone ? Phone.create(person.phone) : null,
            profiles: new Set([PersonProfile.PATIENT]),
            deletedAt: patientModel.deletedAt ?? null,
            birthDate: patientModel.birthDate ?? null,
            email: patientModel.email ?? null,
            emergencyContactName: patientModel.emergencyContactName ?? null,
            emergencyContactPhone: patientModel.emergencyContactPhone ?? null,
        });
    }

    toPersistence(entity: Patient): PatientModel {
        return {
            id: entity.id.toString(),
            professionalId: entity.professionalId?.toString() ?? null,
            documentId: entity.documentId.toString(),
            birthDate: entity.birthDate ?? null,
            email: entity.email ?? null,
            emergencyContactName: entity.emergencyContactName ?? null,
            emergencyContactPhone: entity.emergencyContactPhone ?? null,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
            person: {
                id: entity.id.toString(),
                name: entity.name,
                documentId: entity.documentId.toString(),
                phone: entity.phone?.toString() ?? null,
                gender: toEnumOrNull(PrismaClient.Gender, entity.gender),
                personType: toEnum(PrismaClient.PersonType, entity.personType),
                createdAt: entity.createdAt,
                updatedAt: entity.updatedAt,
                deletedAt: entity.deletedAt ?? null,
            },
        };
    }
}
