import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Event } from "@domain/event";
import { EventRepository } from "@domain/event/event.repository";

@Injectable()
export class RecordEvent {
  constructor(private readonly eventRepository: EventRepository) {}

  @OnEvent("**")
  async handle(event: Event): Promise<void> {
    await this.eventRepository.add(event);
  }
}
