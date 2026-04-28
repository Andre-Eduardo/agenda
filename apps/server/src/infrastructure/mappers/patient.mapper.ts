import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {DocumentId, Phone} from '../../domain/@shared/value-objects';
import {toEnum, toEnumOrNull} from '../../domain/@shared/utils';
import {ClinicId} from '../../domain/clinic/entities';
import {Patient, PatientId, type PatientAddressData, type InsurancePlanSummary} from '../../domain/patient/entities';
import {Gender, PersonType} from '../../domain/person/entities/person.entity';
import {MapperWithoutDto} from './mapper';

export type PatientModel = PrismaClient.Patient & {
    person: PrismaClient.Person;
    address: PrismaClient.PatientAddress | null;
    insurancePlan: PrismaClient.InsurancePlan | null;
};

function toAddressData(model: PrismaClient.PatientAddress): PatientAddressData {
    return {
        street: model.street ?? null,
        number: model.number ?? null,
        complement: model.complement ?? null,
        neighborhood: model.neighborhood ?? null,
        city: model.city ?? null,
        state: model.state ?? null,
        zipCode: model.zipCode ?? null,
        country: model.country ?? null,
    };
}

function toInsurancePlanSummary(model: PrismaClient.InsurancePlan): InsurancePlanSummary {
    return {
        id: model.id,
        name: model.name,
        code: model.code ?? null,
        isActive: model.isActive,
    };
}

@Injectable()
export class PatientMapper extends MapperWithoutDto<Patient, PatientModel> {
    toDomain(model: PatientModel): Patient {
        const {person, address, insurancePlan, ...patientModel} = model;

        return new Patient({
            ...patientModel,
            ...person,
            id: PatientId.from(patientModel.id),
            clinicId: ClinicId.from(patientModel.clinicId),
            documentId: DocumentId.create(patientModel.documentId),
            gender: toEnumOrNull(Gender, person.gender),
            personType: toEnum(PersonType, person.personType),
            phone: person.phone ? Phone.create(person.phone) : null,
            deletedAt: patientModel.deletedAt ?? null,
            birthDate: patientModel.birthDate ?? null,
            email: patientModel.email ?? null,
            emergencyContactName: patientModel.emergencyContactName ?? null,
            emergencyContactPhone: patientModel.emergencyContactPhone ?? null,
            address: address ? toAddressData(address) : null,
            insurancePlanId: patientModel.insurancePlanId ?? null,
            insuranceCardNumber: patientModel.insuranceCardNumber ?? null,
            insuranceValidUntil: patientModel.insuranceValidUntil ?? null,
            insurancePlan: insurancePlan ? toInsurancePlanSummary(insurancePlan) : null,
        });
    }

    toPersistence(entity: Patient): PatientModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            documentId: entity.documentId.toString(),
            birthDate: entity.birthDate ?? null,
            email: entity.email ?? null,
            emergencyContactName: entity.emergencyContactName ?? null,
            emergencyContactPhone: entity.emergencyContactPhone ?? null,
            insurancePlanId: entity.insurancePlanId ?? null,
            insuranceCardNumber: entity.insuranceCardNumber ?? null,
            insuranceValidUntil: entity.insuranceValidUntil ?? null,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
            person: {
                id: entity.id.toString(),
                name: entity.name,
                phone: entity.phone?.toString() ?? null,
                gender: toEnumOrNull(PrismaClient.Gender, entity.gender),
                personType: toEnum(PrismaClient.PersonType, entity.personType),
                createdAt: entity.createdAt,
                updatedAt: entity.updatedAt,
                deletedAt: entity.deletedAt ?? null,
            },
            address: null,
            insurancePlan: null,
        };
    }
}
