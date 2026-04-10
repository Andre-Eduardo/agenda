import {Injectable} from '@nestjs/common';
import {ClinicalProfileRepository} from '../../../domain/clinical-profile/clinical-profile.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ClinicalProfileDto, GetClinicalProfileDto} from '../dtos';

@Injectable()
export class GetClinicalProfileService implements ApplicationService<GetClinicalProfileDto, ClinicalProfileDto | null> {
    constructor(private readonly clinicalProfileRepository: ClinicalProfileRepository) {}

    async execute({payload}: Command<GetClinicalProfileDto>): Promise<ClinicalProfileDto | null> {
        const profile = await this.clinicalProfileRepository.findByPatientId(payload.patientId);

        return profile ? new ClinicalProfileDto(profile) : null;
    }
}
