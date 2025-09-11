import {mock} from 'jest-mock-extended';
import {SimulatedClock} from 'xstate';
import type {Logger} from '../../../../application/@shared/logger';
import {RoomId} from '../../../../domain/room/entities';
import {RoomState, RoomStateEvent} from '../../../../domain/room/models/room-state';
import type {CreateRoomMachineConfig} from '../../../../domain/room/state-machine';
import {XStateRoomMachineFactory} from '../room-machine-factory';

describe('A room machine factory', () => {
    const logger = mock<Logger>();

    it.each([undefined, new SimulatedClock()])('should create a machine', (clock) => {
        const factory = new XStateRoomMachineFactory(logger, clock);
        const roomId = RoomId.generate();

        const config: CreateRoomMachineConfig = {
            roomId,
            stateSnapshot: null,
            onTimeoutTransition: jest.fn(),
        };

        const machine = factory.create(config);

        expect(machine.getCurrentState()).toBe(RoomState.VACANT);
        expect(machine.getNextEvents()).toEqual([
            RoomStateEvent.CHECK_IN,
            RoomStateEvent.BLOCK,
            RoomStateEvent.PERFORM_MAINTENANCE,
            RoomStateEvent.AUDIT,
            RoomStateEvent.PERFORM_DEEP_CLEANING,
        ]);
    });

    it('should create a machine with a snapshot', () => {
        const factory = new XStateRoomMachineFactory(logger);
        const roomId = RoomId.generate();

        const config: CreateRoomMachineConfig = {
            roomId,
            stateSnapshot: {
                status: 'active',
                value: RoomState.CLEANING,
                context: {
                    roomId: roomId.toJSON(),
                    isRentalCheckout: false,
                    previousState: RoomState.DIRTY,
                },
                historyValue: {},
                children: {},
            },
            onTimeoutTransition: jest.fn(),
        };

        const machine = factory.create(config);

        expect(machine.getCurrentState()).toBe(RoomState.CLEANING);
        expect(machine.getNextEvents()).toEqual([RoomStateEvent.COMPLETE_CLEANING, RoomStateEvent.CANCEL_CLEANING]);
    });
});
