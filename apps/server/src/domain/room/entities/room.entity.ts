import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import {InvalidInputException} from '@domain/@shared/exceptions';
import type {ClinicId} from '@domain/clinic/entities';
import {RoomChangedEvent, RoomCreatedEvent, RoomDeletedEvent} from '@domain/room/events';

export type RoomProps = EntityProps<Room>;
export type CreateRoom = CreateEntity<Room>;
export type UpdateRoom = Partial<RoomProps>;

/**
 * Consultório/sala física de atendimento de uma clínica. Só é relevante quando
 * `Clinic.roomManagementEnabled` está ativo — ver docs da Fase 3 do módulo de agenda.
 */
export class Room extends AggregateRoot<RoomId> {
    clinicId: ClinicId;
    name: string;
    active: boolean;

    constructor(props: AllEntityProps<Room>) {
        super(props);
        this.clinicId = props.clinicId;
        this.name = props.name;
        this.active = props.active ?? true;
        this.validate();
    }

    static create(props: CreateRoom): Room {
        const now = new Date();

        const room = new Room({
            ...props,
            id: RoomId.generate(),
            active: props.active ?? true,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        room.addEvent(new RoomCreatedEvent({room, timestamp: now}));

        return room;
    }

    change(props: UpdateRoom): void {
        const oldState = new Room(this);

        if (props.name !== undefined) this.name = props.name;

        if (props.active !== undefined) this.active = props.active;

        this.validate();
        this.addEvent(new RoomChangedEvent({oldState, newState: this}));
    }

    delete(): void {
        super.delete();
        this.addEvent(new RoomDeletedEvent({room: this}));
    }

    private validate(): void {
        if (this.name.trim().length === 0) {
            throw new InvalidInputException('Room name must be at least 1 character long.');
        }
    }

    toJSON(): EntityJson<Room> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            name: this.name,
            active: this.active,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
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
