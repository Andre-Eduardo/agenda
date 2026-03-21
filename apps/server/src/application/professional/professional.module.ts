import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ProfessionalController} from './controllers/professional.controller';
import {
    CreateProfessionalService,
    DeleteProfessionalService,
    GetProfessionalService,
    SearchProfessionalsService,
    UpdateProfessionalService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [ProfessionalController],
    providers: [
        CreateProfessionalService,
        GetProfessionalService,
        SearchProfessionalsService,
        UpdateProfessionalService,
        DeleteProfessionalService,
    ],
})
export class ProfessionalModule {}
