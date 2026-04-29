import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { RecordRepository } from "@domain/record/record.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { GetRecordDto, RecordDto } from "@application/record/dtos";

@Injectable()
export class GetRecordService implements ApplicationService<GetRecordDto, RecordDto> {
  constructor(private readonly recordRepository: RecordRepository) {}

  async execute({ payload }: Command<GetRecordDto>): Promise<RecordDto> {
    const record = await this.recordRepository.findById(payload.id);

    if (record === null) {
      throw new ResourceNotFoundException("Record not found.", payload.id.toString());
    }

    return new RecordDto(record);
  }
}
