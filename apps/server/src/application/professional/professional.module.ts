import {MapperModule} from '../../../infrastructure/mapper.module';

@Module({
    imports: [MapperModule],
    controllers: [ProfessionalController],
    providers: [ProfessionalService],
})
export class ProfessionalModule {}
