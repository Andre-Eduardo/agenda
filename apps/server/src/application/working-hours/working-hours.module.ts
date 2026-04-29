import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { WorkingHoursController } from "@application/working-hours/controllers/working-hours.controller";
import {
  DeleteWorkingHoursService,
  ListWorkingHoursService,
  UpsertWorkingHoursService,
} from "@application/working-hours/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [WorkingHoursController],
  providers: [UpsertWorkingHoursService, ListWorkingHoursService, DeleteWorkingHoursService],
})
export class WorkingHoursModule {}
