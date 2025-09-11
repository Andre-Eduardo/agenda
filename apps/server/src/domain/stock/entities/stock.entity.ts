import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import type {RoomId} from '../../room/entities';
import {StockChangedEvent, StockCreatedEvent, StockDeletedEvent} from '../events';

export type StockProps = EntityProps<Stock>;
export type CreateStock = CreateEntity<Stock>;
export type UpdateStock = Pick<Partial<StockProps>, 'name'>;

export enum StockType {
    ROOM = 'ROOM',
    HALLWAY = 'HALLWAY',
    OTHER = 'OTHER',
    MAIN = 'MAIN',
}

export class Stock extends AggregateRoot<StockId> {
    companyId: CompanyId;
    roomId: RoomId | null;
    name: string | null;
    type: StockType;
    parentId: StockId | null;

    constructor(props: AllEntityProps<Stock>) {
        super(props);
        this.companyId = props.companyId;
        this.roomId = props.roomId;
        this.name = props.name;
        this.type = props.type;
        this.parentId = props.parentId ?? null;
        this.validate();
    }

    static create(props: CreateStock): Stock {
        const stockId = StockId.generate();
        const now = new Date();

        const stock = new Stock({
            ...props,
            id: stockId,
            name: props.name ?? null,
            roomId: props.roomId ?? null,
            parentId: props.parentId ?? null,
            createdAt: now,
            updatedAt: now,
        });

        stock.addEvent(
            new StockCreatedEvent({
                companyId: props.companyId,
                stock,
                timestamp: now,
            })
        );

        return stock;
    }

    change(props: UpdateStock): void {
        const oldStock = new Stock(this);

        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        this.addEvent(new StockChangedEvent({companyId: this.companyId, oldState: oldStock, newState: this}));
    }

    delete(): void {
        this.addEvent(new StockDeletedEvent({companyId: this.companyId, stock: this}));
    }

    toJSON(): EntityJson<Stock> {
        return {
            id: this.id.toString(),
            companyId: this.companyId.toJSON(),
            roomId: this.roomId?.toJSON() ?? null,
            name: this.name,
            type: this.type,
            parentId: this.parentId?.toJSON() ?? null,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof StockProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (
                [StockType.HALLWAY, StockType.OTHER].includes(this.type) &&
                (!this.name || this.name.trim().length === 0)
            ) {
                throw new InvalidInputException('Stock name must be at least 1 character long.');
            }

            if (this.type === StockType.ROOM && this.name) {
                throw new InvalidInputException('Stock cannot have a name for ROOM type.');
            }
        }

        if (fields.length === 0 || fields.includes('roomId')) {
            if (this.type === StockType.ROOM && !this.roomId) {
                throw new InvalidInputException('Room ID must be provided for ROOM type.');
            }

            if (this.type !== StockType.ROOM && this.roomId) {
                throw new InvalidInputException('Room ID should only be provided for ROOM type.');
            }
        }

        if (fields.length === 0 || fields.includes('parentId')) {
            if (this.type !== StockType.MAIN && !this.parentId) {
                throw new InvalidInputException('Stock must have a parent.');
            }
        }
    }
}

export class StockId extends EntityId<'StockId'> {
    static from(value: string): StockId {
        return new StockId(value);
    }

    static generate(): StockId {
        return new StockId();
    }
}
