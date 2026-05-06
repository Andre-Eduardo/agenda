import {Module} from '@nestjs/common';
import {WorkingHoursController} from '@application/working-hours/controllers/working-hours.controller';
import {
    DeleteWorkingHoursService,
    ListWorkingHoursService,
    UpsertWorkingHoursService,
} from '@application/working-hours/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [WorkingHoursController],
    providers: [UpsertWorkingHoursService, ListWorkingHoursService, DeleteWorkingHoursService],
})
export class WorkingHoursModule {}
