import type {CreateEntity, EntityProps, AllEntityProps, EntityJson} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import type {PersonId} from '../../person/entities';
import type {RoomId} from '../../room/entities';
import type {RoomCategoryId} from '../../room-category/entities';
import type {UserId} from '../../user/entities';
import {ReservationCanceledEvent, ReservationCreatedEvent, ReservationChangedEvent} from '../events';

export type ReservationProps = EntityProps<Reservation>;
export type CreateReservation = Omit<
    CreateEntity<Reservation>,
    'canceledAt' | 'canceledBy' | 'canceledReason' | 'noShow'
>;
export type UpdateReservation = Partial<ReservationProps>;

export class Reservation extends AggregateRoot<ReservationId> {
    companyId: CompanyId;
    roomId: RoomId | null;
    roomCategoryId: RoomCategoryId | null;
    checkIn: Date;
    bookedBy: UserId;
    bookedFor: PersonId;
    canceledAt: Date | null;
    canceledBy: UserId | null;
    canceledReason: string | null;
    noShow: boolean;
    note: string | null;

    constructor(props: AllEntityProps<Reservation>) {
        super(props);
        this.companyId = props.companyId;
        this.roomId = props.roomId;
        this.roomCategoryId = props.roomCategoryId;
        this.checkIn = props.checkIn;
        this.bookedBy = props.bookedBy;
        this.bookedFor = props.bookedFor;
        this.canceledAt = props.canceledAt;
        this.canceledBy = props.canceledBy;
        this.canceledReason = props.canceledReason;
        this.noShow = props.noShow;
        this.note = props.note;
        this.validate();
    }

    static create(props: CreateReservation): Reservation {
        const reservationId = ReservationId.generate();
        const now = new Date();

        const reservation = new Reservation({
            ...props,
            id: reservationId,
            roomId: props.roomId ?? null,
            roomCategoryId: props.roomCategoryId ?? null,
            canceledAt: null,
            canceledBy: null,
            canceledReason: null,
            noShow: false,
            note: props.note ?? null,
            createdAt: now,
            updatedAt: now,
        });

        reservation.addEvent(new ReservationCreatedEvent({companyId: props.companyId, reservation, timestamp: now}));

        return reservation;
    }

    change(props: UpdateReservation): void {
        const oldReservation = new Reservation(this);

        if (props.roomId !== undefined) {
            this.roomId = props.roomId;
        }

        if (props.roomCategoryId !== undefined) {
            this.roomCategoryId = props.roomCategoryId;
        }

        this.validate('roomId', 'roomCategoryId');

        if (props.checkIn !== undefined) {
            this.checkIn = props.checkIn;
        }

        if (props.bookedFor !== undefined) {
            this.bookedFor = props.bookedFor;
        }

        if (props.noShow !== undefined) {
            this.noShow = props.noShow;
        }

        if (props.note !== undefined) {
            this.note = props.note?.trim() || null;
        }

        this.addEvent(
            new ReservationChangedEvent({companyId: this.companyId, oldState: oldReservation, newState: this})
        );
    }

    cancel(canceledBy: ReservationProps['canceledBy'], canceledReason?: ReservationProps['canceledReason']): void {
        this.canceledAt = new Date();
        this.canceledBy = canceledBy;
        this.canceledReason = canceledReason?.trim() || null;

        this.addEvent(
            new ReservationCanceledEvent({companyId: this.companyId, reservation: this, timestamp: this.canceledAt})
        );
    }

    toJSON(): EntityJson<Reservation> {
        return {
            id: this.id.toJSON(),
            companyId: this.companyId.toJSON(),
            roomId: this.roomId?.toJSON() ?? null,
            roomCategoryId: this.roomCategoryId?.toJSON() ?? null,
            checkIn: this.checkIn.toJSON(),
            bookedBy: this.bookedBy.toJSON(),
            bookedFor: this.bookedFor.toJSON(),
            canceledAt: this.canceledAt?.toJSON() ?? null,
            canceledBy: this.canceledBy?.toJSON() ?? null,
            canceledReason: this.canceledReason,
            noShow: this.noShow,
            note: this.note,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof ReservationProps>): void {
        if (fields.length === 0 || (fields.includes('roomId') && fields.includes('roomCategoryId'))) {
            if (this.roomId === null && this.roomCategoryId === null) {
                throw new InvalidInputException('Either room or room category must be provided.');
            }
        }
    }
}

export class ReservationId extends EntityId<'ReservationId'> {
    static from(value: string): ReservationId {
        return new ReservationId(value);
    }

    static generate(): ReservationId {
        return new ReservationId();
    }
}
