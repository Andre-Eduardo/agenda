import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {EmployeeController} from './controllers';
import {
    CreateEmployeeService,
    DeleteEmployeeService,
    GetEmployeeService,
    ListEmployeeService,
    UpdateEmployeeService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [EmployeeController],
    providers: [
        CreateEmployeeService,
        ListEmployeeService,
        GetEmployeeService,
        UpdateEmployeeService,
        DeleteEmployeeService,
    ],
})
export class EmployeeModule {}
