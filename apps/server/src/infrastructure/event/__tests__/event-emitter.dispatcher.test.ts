import type {EventEmitter2} from '@nestjs/event-emitter';
import {mockDeep} from 'jest-mock-extended';
import type {Actor} from '../../../domain/@shared/actor';
import type {EntityJson} from '../../../domain/@shared/entity';
import {AggregateRoot} from '../../../domain/@shared/entity';
import {EntityId} from '../../../domain/@shared/entity/id';
import {DomainEvent} from '../../../domain/event';
import {UserId} from '../../../domain/user/entities';
import {EventEmitterDispatcher} from '../index';

class EventMock extends DomainEvent {
    static readonly type = 'COMPANY_CREATED';

    public constructor(public readonly payload: string) {
        super(EventMock.type, new Date());
    }
}

class EntityIdMock extends EntityId<'mock'> {
    public constructor(value = '7a127767-5a1a-440d-9104-b07dbddcea2d') {
        super(value);
    }
}

class AggregateRootMock extends AggregateRoot {
    public constructor() {
        super({id: new EntityIdMock(), createdAt: new Date(), updatedAt: new Date()});
    }

    public addEvents(events: DomainEvent[]): void {
        events.forEach((event) => this.addEvent(event));
    }

    toJSON(): EntityJson<AggregateRootMock> {
        return {
            id: this.id.toJSON(),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }
}

describe('An event dispatcher backed by NestJS EventEmitter', () => {
    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should dispatch domain events', () => {
        const eventEmitter = mockDeep<EventEmitter2>();
        const dispatcher = new EventEmitterDispatcher(eventEmitter);

        const event1 = new EventMock('foo');
        const event2 = new EventMock('bar');
        const entity = new AggregateRootMock();

        entity.addEvents([event1, event2]);

        jest.spyOn(eventEmitter, 'emit').mockImplementation();

        dispatcher.dispatch(actor, entity);

        expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
        expect(eventEmitter.emit).toHaveBeenNthCalledWith(1, EventMock.type, {
            actor,
            payload: event1,
        });
        expect(eventEmitter.emit).toHaveBeenNthCalledWith(2, EventMock.type, {
            actor,
            payload: event2,
        });

        expect(entity.events).toBeEmpty();
    });
});
