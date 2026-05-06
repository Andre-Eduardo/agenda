import {Module} from '@nestjs/common';
import {ProfessionalController} from '@application/professional/controllers/professional.controller';
import {
    CreateProfessionalService,
    DeleteProfessionalService,
    GetProfessionalService,
    SearchProfessionalsService,
    UpdateProfessionalService,
} from '@application/professional/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

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
