import {Injectable} from '@nestjs/common';
import {PatientFormId} from '../../../domain/patient-form/entities';
import {PatientFormRepository} from '../../../domain/patient-form/patient-form.repository';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PatientFormDto} from '../dtos';

export type GetPatientFormDto = {patientFormId: PatientFormId};

@Injectable()
export class GetPatientFormService implements ApplicationService<GetPatientFormDto, PatientFormDto> {
    constructor(private readonly patientFormRepository: PatientFormRepository) {}

    async execute({payload}: Command<GetPatientFormDto>): Promise<PatientFormDto> {
        const form = await this.patientFormRepository.findById(payload.patientFormId);

        if (!form) {
            throw new ResourceNotFoundException('Patient form not found.', 'PatientForm');
        }

        return new PatientFormDto(form);
    }
}
