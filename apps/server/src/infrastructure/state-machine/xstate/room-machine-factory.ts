import {Injectable} from '@nestjs/common';
import {JsonObject} from 'type-fest';
import {createActor, SimulatedClock, Snapshot} from 'xstate';
import {Logger} from '../../../application/@shared/logger';
import {RoomId} from '../../../domain/room/entities';
import {RoomStateEvent} from '../../../domain/room/models/room-state';
import {RoomMachine, RoomMachineFactory, CreateRoomMachineConfig} from '../../../domain/room/state-machine';
import {roomMachine} from './room-machine';

const timeoutMap = {
    'xstate.after.checkoutTimeout.roomState.CHECKOUT': RoomStateEvent.CHECKOUT_TIMEOUT,
    'xstate.after.cleaningTimeout.roomState.CLEANING': RoomStateEvent.CLEANING_TIMEOUT,
    'xstate.after.deepCleaningTimeout.roomState.DEEP_CLEANING': RoomStateEvent.DEEP_CLEANING_TIMEOUT,
    'xstate.after.inspectionTimeout.roomState.INSPECTION': RoomStateEvent.INSPECTION_TIMEOUT,
    'xstate.after.auditTimeout.roomState.AUDIT': RoomStateEvent.AUDIT_TIMEOUT,
} as const;

@Injectable()
export class XStateRoomMachineFactory implements RoomMachineFactory {
    constructor(
        private readonly logger: Logger,
        private readonly clock?: SimulatedClock
    ) {}

    create(config: CreateRoomMachineConfig): RoomMachine {
        const actor = createActor(roomMachine, {
            snapshot: config.stateSnapshot == null ? undefined : (config.stateSnapshot as unknown as Snapshot<unknown>),
            input: {
                roomId: config.roomId.toString(),
            },
            inspect: (payload) => {
                if (payload.type === '@xstate.snapshot' && payload.event.type.includes('xstate.after')) {
                    const snapshot = actor.getSnapshot();

                    config
                        .onTimeoutTransition({
                            roomId: RoomId.from(snapshot.context.roomId),
                            newState: snapshot.value,
                            event: timeoutMap[payload.event.type as keyof typeof timeoutMap],
                            stateSnapshot: JSON.parse(JSON.stringify(actor.getPersistedSnapshot())) as JsonObject,
                        })
                        .catch((e) => {
                            this.logger.error(
                                `Error on timeout transition for the room "${snapshot.context.roomId}".`,
                                e
                            );
                        });
                }
            },
            ...(this.clock ? {clock: this.clock} : {}),
        }).start();

        return {
            dispatch: (event) => actor.send(event),
            can: (event) => actor.getSnapshot().can(event),
            getCurrentState: () => actor.getSnapshot().value,
            getSnapshot: () => JSON.parse(JSON.stringify(actor.getPersistedSnapshot())),
            getNextEvents: () => [
                ...new Set([
                    // eslint-disable-next-line no-underscore-dangle -- That's the way to get next events according to the docs https://stately.ai/docs/migration#statenextevents-has-been-removed
                    ...actor
                        .getSnapshot()
                        ._nodes.flatMap((sn) =>
                            sn.ownEvents.filter((e) => e !== '*').filter((e) => !e.startsWith('xstate'))
                        ),
                ]),
            ],
        };
    }
}
