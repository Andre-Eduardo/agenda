import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import {RoomCategoryCreatedEvent, RoomCategoryDeletedEvent, RoomCategoryChangedEvent} from '../events';

export type RoomCategoryProps = EntityProps<RoomCategory>;
export type CreateRoomCategory = CreateEntity<RoomCategory>;
export type UpdateRoomCategory = Omit<Partial<RoomCategoryProps>, 'companyId'>;

export class RoomCategory extends AggregateRoot<RoomCategoryId> {
    companyId: CompanyId;
    name: string;
    acronym: string;
    guestCount: number;

    constructor(props: AllEntityProps<RoomCategory>) {
        super(props);
        this.companyId = props.companyId;
        this.name = props.name;
        this.acronym = props.acronym.toUpperCase();
        this.guestCount = props.guestCount;
        this.validate();
    }

    static create(props: CreateRoomCategory): RoomCategory {
        const roomCategoryId = RoomCategoryId.generate();
        const now = new Date();

        const roomCategory = new RoomCategory({
            ...props,
            id: roomCategoryId,
            companyId: props.companyId,
            createdAt: now,
            updatedAt: now,
        });

        roomCategory.addEvent(new RoomCategoryCreatedEvent({companyId: props.companyId, roomCategory, timestamp: now}));

        return roomCategory;
    }

    change(props: UpdateRoomCategory): void {
        const oldCategory = new RoomCategory(this);

        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        if (props.acronym !== undefined) {
            this.acronym = props.acronym.toUpperCase();
            this.validate('acronym');
        }

        if (props.guestCount !== undefined) {
            this.guestCount = props.guestCount;
            this.validate('guestCount');
        }

        this.addEvent(
            new RoomCategoryChangedEvent({
                companyId: this.companyId,
                oldState: oldCategory,
                newState: this,
            })
        );
    }

    delete(): void {
        this.addEvent(new RoomCategoryDeletedEvent({companyId: this.companyId, roomCategory: this}));
    }

    toJSON(): EntityJson<RoomCategory> {
        return {
            id: this.id.toJSON(),
            companyId: this.companyId.toJSON(),
            name: this.name,
            acronym: this.acronym,
            guestCount: this.guestCount,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    validate(...fields: Array<keyof RoomCategoryProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (this.name.length < 3) {
                throw new InvalidInputException('Room category name must have at least 3 characters.');
            }
        }

        if (fields.length === 0 || fields.includes('acronym')) {
            if (this.acronym.length < 1 || this.acronym.length > 2) {
                throw new InvalidInputException('Room category acronym must have between 1 and 2 characters.');
            }
        }

        if (fields.length === 0 || fields.includes('guestCount')) {
            if (this.guestCount < 1) {
                throw new InvalidInputException('Room category guest count must be at least 1.');
            }
        }
    }
}

export class RoomCategoryId extends EntityId<'RoomCategoryId'> {
    static from(value: string): RoomCategoryId {
        return new RoomCategoryId(value);
    }

    static generate(): RoomCategoryId {
        return new RoomCategoryId();
    }
}
