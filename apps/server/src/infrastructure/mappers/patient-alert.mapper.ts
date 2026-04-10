import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PatientId} from '../../domain/patient/entities';
import {ProfessionalId} from '../../domain/professional/entities';
import {PatientAlert, PatientAlertId, AlertSeverity} from '../../domain/patient-alert/entities';
import {MapperWithoutDto} from './mapper';

export type PatientAlertModel = PrismaClient.PatientAlert;

@Injectable()
export class PatientAlertMapper extends MapperWithoutDto<PatientAlert, PatientAlertModel> {
    toDomain(model: PatientAlertModel): PatientAlert {
        return new PatientAlert({
            ...model,
            id: PatientAlertId.from(model.id),
            patientId: PatientId.from(model.patientId),
            professionalId: ProfessionalId.from(model.professionalId),
            description: model.description ?? null,
            severity: model.severity as unknown as AlertSeverity,
            isActive: model.isActive,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: PatientAlert): PatientAlertModel {
        return {
            id: entity.id.toString(),
            patientId: entity.patientId.toString(),
            professionalId: entity.professionalId.toString(),
            title: entity.title,
            description: entity.description,
            severity: entity.severity as unknown as PrismaClient.AlertSeverity,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
