import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {WorkingHoursController} from './controllers/working-hours.controller';
import {DeleteWorkingHoursService, ListWorkingHoursService, UpsertWorkingHoursService} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [WorkingHoursController],
    providers: [UpsertWorkingHoursService, ListWorkingHoursService, DeleteWorkingHoursService],
})
export class WorkingHoursModule {}
