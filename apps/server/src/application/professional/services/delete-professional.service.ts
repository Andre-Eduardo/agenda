import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {getProfessionalSchema} from '@application/professional/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {ProfessionalRepository} from '@domain/professional/professional.repository';

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
