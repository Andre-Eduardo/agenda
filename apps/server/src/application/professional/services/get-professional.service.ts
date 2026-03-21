import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ProfessionalRepository} from '../../../domain/professional/professional.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetProfessionalDto, ProfessionalDto} from '../dtos';

@Injectable()
export class GetProfessionalService implements ApplicationService<GetProfessionalDto, ProfessionalDto> {
    constructor(private readonly professionalRepository: ProfessionalRepository) {}

    async execute({payload}: Command<GetProfessionalDto>): Promise<ProfessionalDto> {
        const professional = await this.professionalRepository.findById(payload.id);

        if (professional === null) {
            throw new ResourceNotFoundException('Professional not found.', payload.id.toString());
        }

        return new ProfessionalDto(professional);
    }
}
