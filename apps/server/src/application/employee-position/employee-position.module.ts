import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {EmployeePositionController} from './controllers';
import {
    CreateEmployeePositionService,
    DeleteEmployeePositionService,
    GetEmployeePositionService,
    ListEmployeePositionService,
    UpdateEmployeePositionService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [EmployeePositionController],
    providers: [
        CreateEmployeePositionService,
        ListEmployeePositionService,
        GetEmployeePositionService,
        UpdateEmployeePositionService,
        DeleteEmployeePositionService,
    ],
})
export class EmployeePositionModule {}
