import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PatientDto, UpdatePatientDto} from '../dtos';

@Injectable()
export class UpdatePatientService implements ApplicationService<UpdatePatientDto, PatientDto> {
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload: {id}}: Command<UpdatePatientDto>): Promise<PatientDto> {
        const patient = await this.patientRepository.findById(id);

        if (patient === null) {
            throw new ResourceNotFoundException('Patient not found.', id.toString());
        }

        patient.change();

        await this.patientRepository.save(patient);

        this.eventDispatcher.dispatch(actor, patient);

        return new PatientDto(patient);
    }
}
