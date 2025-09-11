import type {JsonObject} from 'type-fest';
import type {AllEntityProps, CreateEntity, EntityProps, EntityJson} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import type {RoomCategoryId} from '../../room-category/entities';
import {RoomCreatedEvent, RoomChangedEvent, RoomDeletedEvent, RoomStateChangedEvent} from '../events';
import {RoomState} from '../models/room-state';

export type RoomProps = EntityProps<Room>;
export type CreateRoom = Omit<CreateEntity<Room>, 'state' | 'stateSnapshot'>;
export type UpdateRoom = Omit<Partial<RoomProps>, 'companyId' | 'categoryId'>;

export class Room extends AggregateRoot<RoomId> {
    companyId: CompanyId;
    categoryId: RoomCategoryId;
    number: number;
    name: string | null;
    state: RoomState;
    stateSnapshot: JsonObject | null;

    constructor(props: AllEntityProps<Room>) {
        super(props);
        this.companyId = props.companyId;
        this.categoryId = props.categoryId;
        this.number = props.number;
        this.name = props.name;
        this.state = props.state;
        this.stateSnapshot = props.stateSnapshot;
        this.validate();
    }

    static create(props: CreateRoom): Room {
        const roomId = RoomId.generate();
        const now = new Date();

        const room = new Room({
            ...props,
            id: roomId,
            name: props.name ?? null,
            state: RoomState.VACANT,
            stateSnapshot: null,
            createdAt: now,
            updatedAt: now,
        });

        room.addEvent(new RoomCreatedEvent({companyId: props.companyId, room, timestamp: now}));

        return room;
    }

    change(props: UpdateRoom): void {
        const oldRoom = new Room(this);

        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        if (props.number !== undefined) {
            this.number = props.number;
            this.validate('number');
        }

        this.addEvent(
            new RoomChangedEvent({
                companyId: this.companyId,
                oldState: oldRoom,
                newState: this,
            })
        );
    }

    changeState(newState: RoomState, stateMachine: JsonObject): void {
        const oldState = this.state;

        this.state = newState;
        this.stateSnapshot = stateMachine;

        this.addEvent(
            new RoomStateChangedEvent({
                companyId: this.companyId,
                roomId: this.id,
                oldState,
                newState,
            })
        );
    }

    delete(): void {
        this.addEvent(new RoomDeletedEvent({companyId: this.companyId, room: this}));
    }

    toJSON(): Omit<EntityJson<Room>, 'stateSnapshot'> {
        return {
            id: this.id.toJSON(),
            companyId: this.companyId.toJSON(),
            categoryId: this.categoryId.toJSON(),
            number: this.number,
            name: this.name,
            state: this.state,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof RoomProps>): void {
        if (fields.length === 0 || fields.includes('number')) {
            if (this.number < 1) {
                throw new InvalidInputException('Room number must be greater than 0.');
            }
        }

        if (fields.length === 0 || fields.includes('name')) {
            if (this.name !== null && this.name.length < 1) {
                throw new InvalidInputException('Room name must be at least 1 character long.');
            }
        }
    }
}

export class RoomId extends EntityId<'RoomId'> {
    static from(value: string): RoomId {
        return new RoomId(value);
    }

    static generate(): RoomId {
        return new RoomId();
    }
}
