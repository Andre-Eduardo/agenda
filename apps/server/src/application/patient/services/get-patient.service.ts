import {Injectable} from '@nestjs/common';
import {Actor} from '../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetPatientDto, PatientDto} from '../dtos';

@Injectable()
export class GetPatientService implements ApplicationService<GetPatientDto, PatientDto> {
    constructor(private readonly patientRepository: PatientRepository) {}

    async execute({actor, payload}: Command<GetPatientDto, Actor>): Promise<PatientDto> {
        const patient = await this.patientRepository.findById(payload.id, actor.clinicId ?? undefined);

        if (patient === null) {
            throw new ResourceNotFoundException('Patient not found.', payload.id.toString());
        }

        return new PatientDto(patient);
    }
}
