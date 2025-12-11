import {MapperModule} from '@infrastructure/mappers/mapper.module';
import {Module} from '@nestjs/common';
import {ProfessionalController} from './controllers/professional.controller';
import {ProfessionalService} from './services/professional.service';

@Module({
    imports: [MapperModule],
    controllers: [ProfessionalController],
    providers: [ProfessionalService],
})
export class ProfessionalModule {}
