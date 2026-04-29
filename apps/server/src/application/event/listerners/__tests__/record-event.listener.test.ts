import { mock } from "jest-mock-extended";
import type { Event } from "../../../../domain/event";
import { DomainEvent } from "../../../../domain/event";
import type { EventRepository } from "../../../../domain/event/event.repository";
import { UserId } from "../../../../domain/user/entities";
import { RecordEvent } from "../record-event.listener";

class TestEvent extends DomainEvent {
  public constructor() {
    super("COMPANY_CREATED", new Date());
  }
}

describe("A listener that listens all events and records them", () => {
  it("should record a event", async () => {
    const eventRepository = mock<EventRepository>();
    const recordEvent = new RecordEvent(eventRepository);

    const event: Event = {
      actor: { userId: UserId.generate(), ip: "127.0.0.1" },
      payload: new TestEvent(),
    };

    await recordEvent.handle(event);

    expect(eventRepository.add).toHaveBeenCalledWith(event);
  });
});
