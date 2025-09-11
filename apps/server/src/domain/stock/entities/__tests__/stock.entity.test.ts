import {InvalidInputException} from '../../../@shared/exceptions';
import {CompanyId} from '../../../company/entities';
import {RoomId} from '../../../room/entities';
import {StockChangedEvent, StockCreatedEvent, StockDeletedEvent} from '../../events';
import type {CreateStock} from '../stock.entity';
import {Stock, StockId, StockType} from '../stock.entity';
import {fakeStock} from './fake-stock';

describe('A stock', () => {
    const companyId = CompanyId.generate();
    const now = new Date(1000);

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const mainStock = fakeStock({type: StockType.MAIN, companyId});

    describe('on creation', () => {
        it('should emit a stock-created event', () => {
            const data: CreateStock = {
                companyId,
                name: 'Main stock',
                type: StockType.OTHER,
                parentId: mainStock.id,
            };

            const stock = Stock.create(data);

            expect(stock.id).toBeInstanceOf(StockId);
            expect(stock.companyId).toBe(companyId);
            expect(stock.name).toBe(data.name);

            expect(stock.events).toEqual([
                {
                    type: StockCreatedEvent.type,
                    companyId: stock.companyId,
                    timestamp: now,
                    stock,
                },
            ]);
            expect(stock.events[0]).toBeInstanceOf(StockCreatedEvent);
        });

        it.each([
            [{type: StockType.HALLWAY, name: ''}, 'Stock name must be at least 1 character long.'],
            [{type: StockType.ROOM, name: 'Room Name'}, 'Stock cannot have a name for ROOM type.'],
            [{type: StockType.ROOM, roomId: undefined}, 'Room ID must be provided for ROOM type.'],
            [{type: StockType.OTHER, name: 'Other Stock'}, 'Stock must have a parent.'],
            [
                {
                    name: 'Room Name',
                    type: StockType.OTHER,
                    roomId: RoomId.generate(),
                },
                'Room ID should only be provided for ROOM type.',
            ],
        ])('should throw an error when receiving invalid data', (input, expectedError) => {
            const data: CreateStock = {
                companyId,
                ...input,
            };

            expect(() => Stock.create(data)).toThrowWithMessage(InvalidInputException, expectedError);
        });
    });

    describe('on change', () => {
        it('should emit a stock-changed event', () => {
            const stock = fakeStock({
                companyId,
                parentId: mainStock.id,
            });
            const oldStock = fakeStock(stock);

            stock.change({name: 'Hallway stock'});

            expect(stock.name).toBe('Hallway stock');
            expect(stock.roomId).toBeNull();

            expect(stock.events).toEqual([
                {
                    type: StockChangedEvent.type,
                    timestamp: now,
                    companyId,
                    oldState: oldStock,
                    newState: stock,
                },
            ]);
            expect(stock.events[0]).toBeInstanceOf(StockChangedEvent);
        });

        it.each([[{name: ''}, 'Stock name must be at least 1 character long.']])(
            'should throw an error when receiving invalid data',
            (input, expectedError) => {
                const stock = fakeStock({
                    id: StockId.generate(),
                    companyId,
                    parentId: mainStock.id,
                    type: StockType.OTHER,
                    name: 'Other stock',
                });

                expect(() => stock.change(input)).toThrowWithMessage(InvalidInputException, expectedError);
            }
        );
    });

    describe('on deletion', () => {
        it('should emit a stock-deleted event', () => {
            const stock = fakeStock({
                id: StockId.generate(),
                companyId,
                name: 'Main stock',
                type: StockType.OTHER,
                roomId: null,
                parentId: mainStock.id,
                createdAt: new Date(0),
                updatedAt: new Date(0),
            });

            stock.delete();

            expect(stock.events).toEqual([
                {
                    type: StockDeletedEvent.type,
                    timestamp: now,
                    companyId,
                    stock,
                },
            ]);

            expect(stock.events[0]).toBeInstanceOf(StockDeletedEvent);
        });
    });

    it('should be serializable', () => {
        const stock = fakeStock({
            id: StockId.generate(),
            companyId,
            roomId: null,
            name: 'Main stock',
            type: StockType.OTHER,
            parentId: mainStock.id,
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        expect(stock.toJSON()).toEqual({
            id: stock.id.toString(),
            companyId: companyId.toJSON(),
            name: 'Main stock',
            type: StockType.OTHER,
            roomId: null,
            parentId: mainStock.id.toString(),
            createdAt: new Date(1000).toJSON(),
            updatedAt: new Date(1000).toJSON(),
        });
    });

    it('should be serializable main stock', () => {
        const stock = fakeStock({companyId});

        expect(stock.toJSON()).toEqual({
            id: stock.id.toString(),
            companyId: companyId.toJSON(),
            name: null,
            type: StockType.MAIN,
            roomId: null,
            parentId: null,
            createdAt: new Date(1000).toJSON(),
            updatedAt: new Date(1000).toJSON(),
        });
    });
});

describe('A Stock ID', () => {
    it('can be created from a string', () => {
        const uuid = '0c64d1cb-764d-44eb-bb3a-973a854dd449';
        const id = StockId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(StockId.generate()).toBeInstanceOf(StockId);
    });
});
