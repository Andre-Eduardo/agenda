import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { RecordRepository } from "@domain/record/record.repository";
import { EventDispatcher } from "@domain/event";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { z } from "zod";
import { getRecordSchema } from "@application/record/dtos";

type DeleteRecordDto = z.infer<typeof getRecordSchema>;

@Injectable()
export class DeleteRecordService implements ApplicationService<DeleteRecordDto> {
  constructor(
    private readonly recordRepository: RecordRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({ actor, payload }: Command<DeleteRecordDto>): Promise<void> {
    const record = await this.recordRepository.findById(payload.id);

    if (record === null) {
      throw new ResourceNotFoundException("Record not found.", payload.id.toString());
    }

    record.delete();

    await this.recordRepository.delete(record.id);

    this.eventDispatcher.dispatch(actor, record);
  }
}
