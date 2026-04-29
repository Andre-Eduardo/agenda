import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { RecordEvent } from "@application/event/listerners";

@Module({
  imports: [InfrastructureModule],
  providers: [RecordEvent],
})
export class EventModule {}
