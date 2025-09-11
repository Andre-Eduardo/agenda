import {mock} from 'jest-mock-extended';
import type {Logger} from '../../../../application/@shared/logger';
import {RoomId} from '../../../../domain/room/entities';
import {RoomState, RoomStateEvent} from '../../../../domain/room/models/room-state';
import type {RoomMachineEvent, CreateRoomMachineConfig} from '../../../../domain/room/state-machine';
import {XStateRoomMachineFactory} from '../room-machine-factory';

describe('A room machine', () => {
    const logger = mock<Logger>();
    const factory = new XStateRoomMachineFactory(logger);
    const roomId = RoomId.generate();

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should check if an event can be dispatched', () => {
        const config: CreateRoomMachineConfig = {
            roomId,
            stateSnapshot: null,
            onTimeoutTransition: jest.fn(),
        };

        const machine = factory.create(config);

        expect(machine.can({type: RoomStateEvent.APPROVE_INSPECTION, autoRentWhenCarInGarage: false})).toBe(false);
        expect(machine.can({type: RoomStateEvent.CHECK_IN})).toBe(true);

        machine.dispatch({type: RoomStateEvent.CHECK_IN});

        expect(machine.can({type: RoomStateEvent.CHECK_IN})).toBe(false);
        expect(machine.can({type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 1000})).toBe(true);
    });

    it('should return the next events', () => {
        const config: CreateRoomMachineConfig = {
            roomId,
            stateSnapshot: null,
            onTimeoutTransition: jest.fn(),
        };

        const machine = factory.create(config);

        expect(machine.getNextEvents()).toEqual([
            RoomStateEvent.CHECK_IN,
            RoomStateEvent.BLOCK,
            RoomStateEvent.PERFORM_MAINTENANCE,
            RoomStateEvent.AUDIT,
            RoomStateEvent.PERFORM_DEEP_CLEANING,
        ]);

        machine.dispatch({type: RoomStateEvent.CHECK_IN});

        expect(machine.getNextEvents()).toEqual([
            RoomStateEvent.CHECK_OUT,
            RoomStateEvent.CANCEL_RENTAL,
            RoomStateEvent.TRANSFER,
        ]);
    });

    it('should return the snapshot', () => {
        const config: CreateRoomMachineConfig = {
            roomId,
            stateSnapshot: null,
            onTimeoutTransition: jest.fn(),
        };

        const machine = factory.create(config);

        expect(machine.getSnapshot()).toEqual({
            status: 'active',
            value: RoomState.VACANT,
            context: {
                roomId: roomId.toJSON(),
                isRentalCheckout: false,
                previousState: RoomState.VACANT,
            },
            historyValue: {},
            children: {},
        });

        machine.dispatch({type: RoomStateEvent.CHECK_IN});

        expect(machine.getSnapshot()).toEqual({
            status: 'active',
            value: RoomState.OCCUPIED,
            context: {
                roomId: roomId.toJSON(),
                isRentalCheckout: false,
                previousState: RoomState.VACANT,
            },
            historyValue: {},
            children: {},
        });
    });

    type UpdateStateTest = {
        eventFlow: RoomMachineEvent[];
        expectedState: RoomState;
    };

    it.each<UpdateStateTest>([
        // ============== VACANT ==============
        {
            eventFlow: [],
            expectedState: RoomState.VACANT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_CLEANING, cleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: false,
                    autoRentWhenCarInGarage: false,
                },
            ],
            expectedState: RoomState.VACANT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_CLEANING, cleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: true,
                    autoRentWhenCarInGarage: false,
                },
                {type: RoomStateEvent.APPROVE_INSPECTION, autoRentWhenCarInGarage: false},
            ],
            expectedState: RoomState.VACANT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_CLEANING, cleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: true,
                    autoRentWhenCarInGarage: false,
                },
                {type: RoomStateEvent.APPROVE_INSPECTION, autoRentWhenCarInGarage: false},
                {type: RoomStateEvent.AUDIT, auditTimeout: 5},
                {type: RoomStateEvent.COMPLETE_AUDIT_VACANT},
            ],
            expectedState: RoomState.VACANT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_CLEANING, cleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: false,
                    autoRentWhenCarInGarage: true,
                },
            ],
            expectedState: RoomState.OCCUPIED,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_CLEANING, cleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: true,
                    autoRentWhenCarInGarage: true,
                },
                {type: RoomStateEvent.APPROVE_INSPECTION, autoRentWhenCarInGarage: true},
            ],
            expectedState: RoomState.OCCUPIED,
        },

        // ============== RENTAL ==============
        {
            eventFlow: [{type: RoomStateEvent.CHECK_IN}],
            expectedState: RoomState.OCCUPIED,
        },
        {
            eventFlow: [{type: RoomStateEvent.CHECK_IN}, {type: RoomStateEvent.CANCEL_RENTAL}],
            expectedState: RoomState.CHECKOUT,
        },
        {
            eventFlow: [{type: RoomStateEvent.CHECK_IN}, {type: RoomStateEvent.TRANSFER}],
            expectedState: RoomState.CHECKOUT,
        },
        {
            eventFlow: [{type: RoomStateEvent.CHECK_IN}, {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5}],
            expectedState: RoomState.CHECKOUT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
            ],
            expectedState: RoomState.DIRTY,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.CANCEL_CHECKOUT},
            ],
            expectedState: RoomState.OCCUPIED,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CANCEL_RENTAL},
                {type: RoomStateEvent.CANCEL_CHECKOUT}, // To check if the cancel event is ignored
            ],
            expectedState: RoomState.CHECKOUT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.TRANSFER},
                {type: RoomStateEvent.CANCEL_CHECKOUT}, // To check if the cancel event is ignored
            ],
            expectedState: RoomState.CHECKOUT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.CANCEL_CHECKOUT},
                {type: RoomStateEvent.CANCEL_RENTAL},
                {type: RoomStateEvent.CANCEL_CHECKOUT}, // To check if the cancel event is ignored
            ],
            expectedState: RoomState.CHECKOUT,
        },

        // ============== CLEANING ==============
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_CLEANING, cleaningTimeout: 5},
            ],
            expectedState: RoomState.CLEANING,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_CLEANING, cleaningTimeout: 5},
                {type: RoomStateEvent.CANCEL_CLEANING},
            ],
            expectedState: RoomState.DIRTY,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_CLEANING, cleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: false,
                    autoRentWhenCarInGarage: false,
                },
            ],
            expectedState: RoomState.VACANT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_CLEANING, cleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: true,
                    autoRentWhenCarInGarage: false,
                },
            ],
            expectedState: RoomState.INSPECTION,
        },

        // ============== DEEP CLEANING ==============
        {
            eventFlow: [{type: RoomStateEvent.PERFORM_DEEP_CLEANING, deepCleaningTimeout: 5}],
            expectedState: RoomState.DEEP_CLEANING,
        },
        {
            eventFlow: [
                {
                    type: RoomStateEvent.PERFORM_DEEP_CLEANING,
                    deepCleaningTimeout: 5,
                },
                {
                    type: RoomStateEvent.CANCEL_DEEP_CLEANING,
                },
            ],
            expectedState: RoomState.DIRTY,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.PERFORM_DEEP_CLEANING, deepCleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_DEEP_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: false,
                    autoRentWhenCarInGarage: false,
                },
            ],
            expectedState: RoomState.VACANT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_DEEP_CLEANING, deepCleaningTimeout: 5},
            ],
            expectedState: RoomState.DEEP_CLEANING,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_DEEP_CLEANING, deepCleaningTimeout: 5},
                {type: RoomStateEvent.CANCEL_DEEP_CLEANING},
            ],
            expectedState: RoomState.DIRTY,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_DEEP_CLEANING, deepCleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_DEEP_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: false,
                    autoRentWhenCarInGarage: false,
                },
            ],
            expectedState: RoomState.VACANT,
        },

        // ============== INSPECTION ==============
        {
            eventFlow: [
                {type: RoomStateEvent.PERFORM_DEEP_CLEANING, deepCleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_DEEP_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: true,
                    autoRentWhenCarInGarage: false,
                },
            ],
            expectedState: RoomState.INSPECTION,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_DEEP_CLEANING, deepCleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_DEEP_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: true,
                    autoRentWhenCarInGarage: false,
                },
            ],
            expectedState: RoomState.INSPECTION,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.PERFORM_DEEP_CLEANING, deepCleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_DEEP_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: true,
                    autoRentWhenCarInGarage: false,
                },
                {type: RoomStateEvent.APPROVE_INSPECTION, autoRentWhenCarInGarage: false},
            ],
            expectedState: RoomState.VACANT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.PERFORM_DEEP_CLEANING, deepCleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_DEEP_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: true,
                    autoRentWhenCarInGarage: false,
                },
                {type: RoomStateEvent.REJECT_INSPECTION},
            ],
            expectedState: RoomState.DIRTY,
        },

        // ============== AUDIT ==============
        {
            eventFlow: [{type: RoomStateEvent.AUDIT, auditTimeout: 5}],
            expectedState: RoomState.AUDIT,
        },
        {
            eventFlow: [{type: RoomStateEvent.AUDIT, auditTimeout: 5}, {type: RoomStateEvent.COMPLETE_AUDIT_VACANT}],
            expectedState: RoomState.VACANT,
        },
        {
            eventFlow: [{type: RoomStateEvent.AUDIT, auditTimeout: 5}, {type: RoomStateEvent.COMPLETE_AUDIT_DIRTY}],
            expectedState: RoomState.DIRTY,
        },
        {
            eventFlow: [{type: RoomStateEvent.AUDIT, auditTimeout: 5}, {type: RoomStateEvent.COMPLETE_AUDIT_BLOCKED}],
            expectedState: RoomState.BLOCKED,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.AUDIT, auditTimeout: 5},
            ],
            expectedState: RoomState.AUDIT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.AUDIT, auditTimeout: 5},
                {type: RoomStateEvent.COMPLETE_AUDIT_VACANT},
            ],
            expectedState: RoomState.VACANT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.AUDIT, auditTimeout: 5},
                {type: RoomStateEvent.COMPLETE_AUDIT_DIRTY},
            ],
            expectedState: RoomState.DIRTY,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.AUDIT, auditTimeout: 5},
                {type: RoomStateEvent.COMPLETE_AUDIT_BLOCKED},
            ],
            expectedState: RoomState.BLOCKED,
        },

        // ============== BLOCKED ==============
        {
            eventFlow: [{type: RoomStateEvent.BLOCK}],
            expectedState: RoomState.BLOCKED,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.BLOCK},
            ],
            expectedState: RoomState.BLOCKED,
        },
        {
            eventFlow: [{type: RoomStateEvent.BLOCK}, {type: RoomStateEvent.UNBLOCK}],
            expectedState: RoomState.DIRTY,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.BLOCK},
                {type: RoomStateEvent.UNBLOCK},
            ],
            expectedState: RoomState.DIRTY,
        },
        {
            eventFlow: [{type: RoomStateEvent.BLOCK}, {type: RoomStateEvent.AUDIT, auditTimeout: 5}],
            expectedState: RoomState.AUDIT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.BLOCK},
                {type: RoomStateEvent.AUDIT, auditTimeout: 5},
            ],
            expectedState: RoomState.AUDIT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.BLOCK},
                {type: RoomStateEvent.AUDIT, auditTimeout: 5},
                {type: RoomStateEvent.COMPLETE_AUDIT_BLOCKED},
            ],
            expectedState: RoomState.BLOCKED,
        },

        // ============== MAINTENANCE ==============
        {
            eventFlow: [{type: RoomStateEvent.PERFORM_MAINTENANCE}],
            expectedState: RoomState.MAINTENANCE,
        },
        {
            eventFlow: [{type: RoomStateEvent.BLOCK}, {type: RoomStateEvent.PERFORM_MAINTENANCE}],
            expectedState: RoomState.MAINTENANCE,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_MAINTENANCE},
            ],
            expectedState: RoomState.MAINTENANCE,
        },
        {
            eventFlow: [{type: RoomStateEvent.PERFORM_MAINTENANCE}, {type: RoomStateEvent.COMPLETE_MAINTENANCE}],
            expectedState: RoomState.DIRTY,
        },
        {
            eventFlow: [{type: RoomStateEvent.PERFORM_MAINTENANCE}, {type: RoomStateEvent.BLOCK}],
            expectedState: RoomState.BLOCKED,
        },
    ])('should update the room state', ({eventFlow, expectedState}) => {
        const config: CreateRoomMachineConfig = {
            roomId,
            stateSnapshot: null,
            onTimeoutTransition: jest.fn(),
        };

        const machine = factory.create(config);

        eventFlow.forEach((event) => {
            machine.dispatch(event);
        });

        expect(machine.getCurrentState()).toBe(expectedState);
    });

    type StateTimeoutTest = {
        eventFlow: RoomMachineEvent[];
        stateBeforeTimeout: RoomState;
        stateAfterTimeout: RoomState;
        timeoutEvent: RoomStateEvent;
    };

    it.each<StateTimeoutTest>([
        {
            eventFlow: [{type: RoomStateEvent.CHECK_IN}, {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5}],
            stateBeforeTimeout: RoomState.CHECKOUT,
            stateAfterTimeout: RoomState.OCCUPIED,
            timeoutEvent: RoomStateEvent.CHECKOUT_TIMEOUT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_CLEANING, cleaningTimeout: 5},
            ],
            stateBeforeTimeout: RoomState.CLEANING,
            stateAfterTimeout: RoomState.DIRTY,
            timeoutEvent: RoomStateEvent.CLEANING_TIMEOUT,
        },
        {
            eventFlow: [{type: RoomStateEvent.PERFORM_DEEP_CLEANING, deepCleaningTimeout: 5}],
            stateBeforeTimeout: RoomState.DEEP_CLEANING,
            stateAfterTimeout: RoomState.DIRTY,
            timeoutEvent: RoomStateEvent.DEEP_CLEANING_TIMEOUT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.PERFORM_CLEANING, cleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: true,
                    autoRentWhenCarInGarage: false,
                },
            ],
            stateBeforeTimeout: RoomState.INSPECTION,
            stateAfterTimeout: RoomState.VACANT,
            timeoutEvent: RoomStateEvent.INSPECTION_TIMEOUT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.PERFORM_DEEP_CLEANING, deepCleaningTimeout: 5},
                {
                    type: RoomStateEvent.COMPLETE_DEEP_CLEANING,
                    inspectionTimeout: 5,
                    inspectionEnabled: true,
                    autoRentWhenCarInGarage: false,
                },
            ],
            stateBeforeTimeout: RoomState.INSPECTION,
            stateAfterTimeout: RoomState.VACANT,
            timeoutEvent: RoomStateEvent.INSPECTION_TIMEOUT,
        },
        {
            eventFlow: [{type: RoomStateEvent.AUDIT, auditTimeout: 5}],
            stateBeforeTimeout: RoomState.AUDIT,
            stateAfterTimeout: RoomState.VACANT,
            timeoutEvent: RoomStateEvent.AUDIT_TIMEOUT,
        },
        {
            eventFlow: [
                {type: RoomStateEvent.CHECK_IN},
                {type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5},
                {type: RoomStateEvent.COMPLETE_RENTAL},
                {type: RoomStateEvent.AUDIT, auditTimeout: 5},
            ],
            stateBeforeTimeout: RoomState.AUDIT,
            stateAfterTimeout: RoomState.DIRTY,
            timeoutEvent: RoomStateEvent.AUDIT_TIMEOUT,
        },
        {
            eventFlow: [{type: RoomStateEvent.BLOCK}, {type: RoomStateEvent.AUDIT, auditTimeout: 5}],
            stateBeforeTimeout: RoomState.AUDIT,
            stateAfterTimeout: RoomState.BLOCKED,
            timeoutEvent: RoomStateEvent.AUDIT_TIMEOUT,
        },
    ])(
        'should change the state on timeout transition',
        ({eventFlow, stateBeforeTimeout, stateAfterTimeout, timeoutEvent}) => {
            const config: CreateRoomMachineConfig = {
                roomId,
                stateSnapshot: null,
                onTimeoutTransition: jest.fn().mockResolvedValue(undefined),
            };

            const machine = factory.create(config);

            eventFlow.forEach((event) => {
                machine.dispatch(event);
            });

            expect(machine.getCurrentState()).toBe(stateBeforeTimeout);

            jest.advanceTimersByTime(5 * 1000);

            expect(machine.getCurrentState()).toBe(stateAfterTimeout);

            expect(config.onTimeoutTransition).toHaveBeenCalledWith({
                roomId,
                newState: stateAfterTimeout,
                event: timeoutEvent,
                stateSnapshot: expect.any(Object),
            });
        }
    );

    it('should log an error on timeout transition failure', async () => {
        const config: CreateRoomMachineConfig = {
            roomId,
            stateSnapshot: null,
            onTimeoutTransition: jest.fn().mockRejectedValue(new Error('Failed')),
        };

        const machine = factory.create(config);

        machine.dispatch({type: RoomStateEvent.CHECK_IN});

        machine.dispatch({type: RoomStateEvent.CHECK_OUT, checkoutTimeout: 5});

        jest.advanceTimersByTime(5 * 1000);

        jest.useRealTimers();

        await new Promise((resolve) => {
            process.nextTick(resolve);
        });

        expect(logger.error).toHaveBeenCalledWith(
            `Error on timeout transition for the room "${roomId}".`,
            new Error('Failed')
        );
    });
});
