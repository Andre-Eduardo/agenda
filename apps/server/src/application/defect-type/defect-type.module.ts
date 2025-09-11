import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {DefectTypeController} from './controllers';
import {
    CreateDefectTypeService,
    DeleteDefectTypeService,
    GetDefectTypeService,
    ListDefectTypeService,
    UpdateDefectTypeService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [DefectTypeController],
    providers: [
        CreateDefectTypeService,
        ListDefectTypeService,
        GetDefectTypeService,
        UpdateDefectTypeService,
        DeleteDefectTypeService,
    ],
})
export class DefectTypeModule {}
