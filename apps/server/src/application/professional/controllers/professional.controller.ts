import {Controller} from '@nestjs/common';
import {ProfessionalService} from '../services/professional.service';

@Controller('professionals')
export class ProfessionalController {
    constructor(private readonly service: ProfessionalService) {}
}
