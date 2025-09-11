import type {JsonObject} from 'type-fest';
import type {RoomId} from '../entities';
import type {RoomState, RoomStateEvent} from '../models/room-state';

export type RoomMachineEvent =
    | {type: RoomStateEvent.CHECK_IN}
    | {
          type: RoomStateEvent.CHECK_OUT;
          checkoutTimeout: number; // In seconds
      }
    | {type: RoomStateEvent.CANCEL_CHECKOUT}
    | {type: RoomStateEvent.COMPLETE_RENTAL}
    | {type: RoomStateEvent.CANCEL_RENTAL}
    | {type: RoomStateEvent.TRANSFER}
    | {
          type: RoomStateEvent.PERFORM_CLEANING;
          cleaningTimeout: number; // In seconds
      }
    | {
          type: RoomStateEvent.COMPLETE_CLEANING;
          inspectionTimeout: number; // In seconds
          inspectionEnabled: boolean;
          autoRentWhenCarInGarage: boolean;
      }
    | {type: RoomStateEvent.CANCEL_CLEANING}
    | {
          type: RoomStateEvent.PERFORM_DEEP_CLEANING;
          deepCleaningTimeout: number; // In seconds
      }
    | {
          type: RoomStateEvent.COMPLETE_DEEP_CLEANING;
          inspectionTimeout: number; // In seconds
          inspectionEnabled: boolean;
          autoRentWhenCarInGarage: boolean;
      }
    | {type: RoomStateEvent.CANCEL_DEEP_CLEANING}
    | {
          type: RoomStateEvent.APPROVE_INSPECTION;
          autoRentWhenCarInGarage: boolean;
      }
    | {type: RoomStateEvent.REJECT_INSPECTION}
    | {
          type: RoomStateEvent.AUDIT;
          auditTimeout: number; // In seconds
      }
    | {type: RoomStateEvent.COMPLETE_AUDIT_VACANT}
    | {type: RoomStateEvent.COMPLETE_AUDIT_DIRTY}
    | {type: RoomStateEvent.COMPLETE_AUDIT_BLOCKED}
    | {type: RoomStateEvent.BLOCK}
    | {type: RoomStateEvent.UNBLOCK}
    | {type: RoomStateEvent.PERFORM_MAINTENANCE}
    | {type: RoomStateEvent.COMPLETE_MAINTENANCE}
    | {type: RoomStateEvent.CHECKOUT_TIMEOUT}
    | {type: RoomStateEvent.CLEANING_TIMEOUT}
    | {type: RoomStateEvent.DEEP_CLEANING_TIMEOUT}
    | {type: RoomStateEvent.INSPECTION_TIMEOUT}
    | {type: RoomStateEvent.AUDIT_TIMEOUT};

export type TimeoutTransitionPayload = {
    roomId: RoomId;
    newState: RoomState;
    event: RoomStateEvent;
    stateSnapshot: JsonObject;
};

export type CreateRoomMachineConfig = {
    roomId: RoomId;
    stateSnapshot: JsonObject | null;
    onTimeoutTransition: (payload: TimeoutTransitionPayload) => Promise<void>;
};

export type RoomMachine = {
    dispatch(event: RoomMachineEvent): void;
    can(event: RoomMachineEvent): boolean;
    getCurrentState(): RoomState;
    getNextEvents(): RoomStateEvent[];
    getSnapshot(): JsonObject;
};

export interface RoomMachineFactory {
    create(config: CreateRoomMachineConfig): RoomMachine;
}

export abstract class RoomMachineFactory {}
