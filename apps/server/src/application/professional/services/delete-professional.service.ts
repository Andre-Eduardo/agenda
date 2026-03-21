import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ProfessionalRepository} from '../../../domain/professional/professional.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {z} from 'zod';
import {getProfessionalSchema} from '../dtos';

type DeleteProfessionalDto = z.infer<typeof getProfessionalSchema>;

@Injectable()
export class DeleteProfessionalService implements ApplicationService<DeleteProfessionalDto> {
    constructor(
        private readonly professionalRepository: ProfessionalRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteProfessionalDto>): Promise<void> {
        const professional = await this.professionalRepository.findById(payload.id);

        if (professional === null) {
            throw new ResourceNotFoundException('Professional not found.', payload.id.toString());
        }

        professional.delete();

        await this.professionalRepository.delete(professional.id);

        this.eventDispatcher.dispatch(actor, professional);
    }
}
