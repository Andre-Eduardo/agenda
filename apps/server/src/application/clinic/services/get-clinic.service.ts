import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ClinicId} from '../../../domain/clinic/entities';
import {ClinicRepository} from '../../../domain/clinic/clinic.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ClinicDto} from '../dtos';

export type GetClinicInput = {clinicId: ClinicId};

@Injectable()
export class GetClinicService implements ApplicationService<GetClinicInput, ClinicDto> {
    constructor(private readonly clinicRepository: ClinicRepository) {}

    async execute({payload}: Command<GetClinicInput>): Promise<ClinicDto> {
        const clinic = await this.clinicRepository.findById(payload.clinicId);

        if (clinic === null) {
            throw new ResourceNotFoundException('clinic.not_found', payload.clinicId.toString());
        }

        return new ClinicDto(clinic);
    }
}
