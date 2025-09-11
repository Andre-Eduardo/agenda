import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {DefectController} from './controllers';
import {
    CreateDefectService,
    DeleteDefectService,
    FinishDefectService,
    GetDefectService,
    ListDefectService,
    UpdateDefectService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [DefectController],
    providers: [
        CreateDefectService,
        ListDefectService,
        GetDefectService,
        UpdateDefectService,
        DeleteDefectService,
        FinishDefectService,
    ],
})
export class DefectModule {}
