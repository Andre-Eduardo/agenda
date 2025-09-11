import {assertEvent, assign, setup} from 'xstate';
import {RoomStateEvent, RoomState} from '../../../domain/room/models/room-state';
import type {RoomMachineEvent} from '../../../domain/room/state-machine';

export const roomMachine = setup({
    types: {
        context: {} as {
            roomId: string;
            previousState: RoomState;
            isRentalCheckout: boolean;
        },
        events: {} as RoomMachineEvent,
        input: {} as {
            roomId: string;
        },
    },
    delays: {
        checkoutTimeout: ({event}) => {
            assertEvent(event, [RoomStateEvent.CHECK_OUT, RoomStateEvent.CANCEL_RENTAL, RoomStateEvent.TRANSFER]);

            if (event.type === RoomStateEvent.CANCEL_RENTAL || event.type === RoomStateEvent.TRANSFER) {
                // These events also cause a checkout, but the checkout cannot be cancelled.
                // So there is no timeout, but it shouldn't throw an error.
                // This delay should be used with a guard to prevent the checkout cancellation.
                return 0;
            }

            return event.checkoutTimeout * 1000;
        },
        cleaningTimeout: ({event}) => {
            assertEvent(event, RoomStateEvent.PERFORM_CLEANING);

            return event.cleaningTimeout * 1000;
        },
        deepCleaningTimeout: ({event}) => {
            assertEvent(event, RoomStateEvent.PERFORM_DEEP_CLEANING);

            return event.deepCleaningTimeout * 1000;
        },
        inspectionTimeout: ({event}) => {
            assertEvent(event, [RoomStateEvent.COMPLETE_CLEANING, RoomStateEvent.COMPLETE_DEEP_CLEANING]);

            return event.inspectionTimeout * 1000;
        },
        auditTimeout: ({event}) => {
            assertEvent(event, RoomStateEvent.AUDIT);

            return event.auditTimeout * 1000;
        },
    },
    actions: {
        storePreviousState: assign({
            previousState: ({self, context}) => {
                const snapshot = self.getSnapshot();

                /* istanbul ignore next */
                // There is no snapshot in Eventless (always) transitions.
                if (!snapshot) {
                    return context.previousState;
                }

                return snapshot.value as RoomState;
            },
        }),
        setRentalCheckout: assign({isRentalCheckout: true}),
        clearRentalCheckout: assign({isRentalCheckout: false}),
    },
    guards: {
        autoRentWhenCarInGarage: ({event}) => {
            if (
                event.type === RoomStateEvent.COMPLETE_CLEANING ||
                event.type === RoomStateEvent.COMPLETE_DEEP_CLEANING ||
                event.type === RoomStateEvent.APPROVE_INSPECTION
            ) {
                return event.autoRentWhenCarInGarage;
            }

            return false;
        },
        // Do not allow checkout cancellation when in process of rental cancellation or transfer.
        allowCheckoutCancellation: ({context}) => context.isRentalCheckout,
    },
}).createMachine({
    context: ({input}) => ({
        roomId: input.roomId,
        previousState: RoomState.VACANT,
        isRentalCheckout: false,
    }),
    id: 'roomState',
    initial: RoomState.VACANT,
    states: {
        [RoomState.VACANT]: {
            on: {
                [RoomStateEvent.CHECK_IN]: RoomState.OCCUPIED,
                [RoomStateEvent.BLOCK]: RoomState.BLOCKED,
                [RoomStateEvent.PERFORM_MAINTENANCE]: RoomState.MAINTENANCE,
                [RoomStateEvent.AUDIT]: RoomState.AUDIT,
                [RoomStateEvent.PERFORM_DEEP_CLEANING]: RoomState.DEEP_CLEANING,
            },
            always: [
                {
                    guard: 'autoRentWhenCarInGarage',
                    target: RoomState.OCCUPIED,
                },
                {
                    target: RoomState.VACANT,
                },
            ],
            exit: 'storePreviousState',
        },
        [RoomState.OCCUPIED]: {
            on: {
                [RoomStateEvent.CHECK_OUT]: {
                    target: RoomState.CHECKOUT,
                    actions: 'setRentalCheckout',
                },
                [RoomStateEvent.CANCEL_RENTAL]: RoomState.CHECKOUT,
                [RoomStateEvent.TRANSFER]: RoomState.CHECKOUT,
            },
            exit: 'storePreviousState',
        },
        [RoomState.CHECKOUT]: {
            on: {
                [RoomStateEvent.COMPLETE_RENTAL]: RoomState.DIRTY,
                [RoomStateEvent.CANCEL_CHECKOUT]: {
                    guard: 'allowCheckoutCancellation',
                    target: RoomState.OCCUPIED,
                },
            },
            after: {
                checkoutTimeout: {
                    guard: 'allowCheckoutCancellation',
                    target: RoomState.OCCUPIED,
                },
            },
            exit: ['clearRentalCheckout', 'storePreviousState'],
        },
        [RoomState.DIRTY]: {
            on: {
                [RoomStateEvent.PERFORM_CLEANING]: RoomState.CLEANING,
                [RoomStateEvent.PERFORM_DEEP_CLEANING]: RoomState.DEEP_CLEANING,
                [RoomStateEvent.BLOCK]: RoomState.BLOCKED,
                [RoomStateEvent.PERFORM_MAINTENANCE]: RoomState.MAINTENANCE,
                [RoomStateEvent.AUDIT]: RoomState.AUDIT,
            },
            exit: 'storePreviousState',
        },
        [RoomState.CLEANING]: {
            on: {
                [RoomStateEvent.COMPLETE_CLEANING]: [
                    {
                        guard: ({event}) => event.inspectionEnabled,
                        target: RoomState.INSPECTION,
                    },
                    {
                        target: RoomState.VACANT,
                    },
                ],
                [RoomStateEvent.CANCEL_CLEANING]: RoomState.DIRTY,
            },
            after: {
                cleaningTimeout: {
                    target: RoomState.DIRTY,
                },
            },
            exit: 'storePreviousState',
        },
        [RoomState.DEEP_CLEANING]: {
            on: {
                [RoomStateEvent.COMPLETE_DEEP_CLEANING]: [
                    {
                        guard: ({event}) => event.inspectionEnabled,
                        target: RoomState.INSPECTION,
                    },
                    {
                        target: RoomState.VACANT,
                    },
                ],
                [RoomStateEvent.CANCEL_DEEP_CLEANING]: RoomState.DIRTY,
            },
            after: {
                deepCleaningTimeout: {
                    target: RoomState.DIRTY,
                },
            },
            exit: 'storePreviousState',
        },
        [RoomState.INSPECTION]: {
            on: {
                [RoomStateEvent.APPROVE_INSPECTION]: RoomState.VACANT,
                [RoomStateEvent.REJECT_INSPECTION]: RoomState.DIRTY,
            },
            after: {
                inspectionTimeout: {
                    target: RoomState.VACANT,
                },
            },
            exit: 'storePreviousState',
        },
        [RoomState.AUDIT]: {
            on: {
                [RoomStateEvent.COMPLETE_AUDIT_VACANT]: RoomState.VACANT,
                [RoomStateEvent.COMPLETE_AUDIT_DIRTY]: RoomState.DIRTY,
                [RoomStateEvent.COMPLETE_AUDIT_BLOCKED]: RoomState.BLOCKED,
            },
            after: {
                auditTimeout: [
                    {
                        guard: ({context}) => context.previousState === RoomState.VACANT,
                        target: RoomState.VACANT,
                    },
                    {
                        guard: ({context}) => context.previousState === RoomState.DIRTY,
                        target: RoomState.DIRTY,
                    },
                    {
                        guard: ({context}) => context.previousState === RoomState.BLOCKED,
                        target: RoomState.BLOCKED,
                    },
                ],
            },
            exit: 'storePreviousState',
        },
        [RoomState.BLOCKED]: {
            on: {
                [RoomStateEvent.UNBLOCK]: RoomState.DIRTY,
                [RoomStateEvent.PERFORM_MAINTENANCE]: RoomState.MAINTENANCE,
                [RoomStateEvent.AUDIT]: RoomState.AUDIT,
            },
            exit: 'storePreviousState',
        },
        [RoomState.MAINTENANCE]: {
            on: {
                [RoomStateEvent.COMPLETE_MAINTENANCE]: RoomState.DIRTY,
                [RoomStateEvent.BLOCK]: RoomState.BLOCKED,
            },
            exit: 'storePreviousState',
        },
    },
});
