import {Module} from '@nestjs/common';
import {PersonMapper} from './person.mapper';
import {ProfessionalMapper} from './professional.mapper';

@Module({
    providers: [PersonMapper, ProfessionalMapper],
    exports: [PersonMapper, ProfessionalMapper],
})
export class MapperModule {}
