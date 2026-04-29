import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { RecordController } from "@application/record/controllers/record.controller";
import {
  CreateRecordService,
  DeleteRecordService,
  GetRecordAmendmentsService,
  GetRecordService,
  ReopenRecordService,
  SearchRecordsService,
  SignRecordService,
  UpdateRecordService,
} from "@application/record/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [RecordController],
  providers: [
    CreateRecordService,
    GetRecordService,
    GetRecordAmendmentsService,
    SearchRecordsService,
    UpdateRecordService,
    DeleteRecordService,
    SignRecordService,
    ReopenRecordService,
  ],
})
export class RecordModule {}
