import {Injectable} from '@nestjs/common';
import {ProfessionalRepository} from '../../../domain/professional/professional.repository';
import {ProfessionalMapper} from '../../../infrastructure/mappers/professional.mapper';

@Injectable()
export class ProfessionalService {
    constructor(
        private readonly repository: ProfessionalRepository,
        private readonly mapper: ProfessionalMapper
    ) {}

    // Example method demonstrating DTO usage
    /* async findById(id: string): Promise<ProfessionalDto | null> {
        // Implementation would require converting string to ProfessionalId
        // const entity = await this.repository.findById(ProfessionalId.from(id));
        // return entity ? this.mapper.toDto(entity) : null;
        return null; // Placeholder
    } */
}
