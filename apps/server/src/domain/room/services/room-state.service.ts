import {Injectable} from '@nestjs/common';
import {unknownActor} from '../../@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../@shared/exceptions';
import {AuditRepository} from '../../audit/audit.repository';
import {AuditEndReasonType} from '../../audit/entities';
import {CleaningRepository} from '../../cleaning/cleaning.repository';
import {CleaningEndReasonType} from '../../cleaning/entities';
import {DeepCleaningRepository} from '../../deep-cleaning/deep-cleaning.repository';
import {DeepCleaningEndReasonType} from '../../deep-cleaning/entities';
import {EventDispatcher} from '../../event';
import {InspectionEndReasonType} from '../../inspection/entities';
import {InspectionRepository} from '../../inspection/inspection.repository';
import {Room, RoomId} from '../entities';
import {RoomStateEvent} from '../models/room-state';
import {RoomRepository} from '../room.repository';
import {RoomMachine, RoomMachineEvent, RoomMachineFactory, TimeoutTransitionPayload} from '../state-machine';

@Injectable()
export class RoomStateService {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly roomMachineFactory: RoomMachineFactory,
        private readonly cleaningRepository: CleaningRepository,
        private readonly deepCleaningRepository: DeepCleaningRepository,
        private readonly inspectionRepository: InspectionRepository,
        private readonly auditRepository: AuditRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async changeRoomState(room: Room, event: RoomMachineEvent): Promise<Room>;

    async changeRoomState(roomId: RoomId, event: RoomMachineEvent): Promise<Room>;

    /**
     * Main method to change the room state.
     *
     * All room state changes should be done through this method.
     *
     * This method is responsible for changing the room state given the current state and the event to be triggered.
     *
     * @param roomOrId The room or the room ID
     * @param event The event to be triggered
     * @returns The new room state
     */
    async changeRoomState(roomOrId: Room | RoomId, event: RoomMachineEvent): Promise<Room> {
        const room = roomOrId instanceof Room ? roomOrId : await this.roomRepository.findById(roomOrId);

        if (room === null) {
            throw new ResourceNotFoundException('Room not found', (roomOrId as RoomId).toString());
        }

        const machine = this.createRoomMachine(room);

        if (!machine.can(event)) {
            throw new PreconditionException(
                `The event ${event.type} is not valid for the current state ${machine.getCurrentState()} ` +
                    `of the room ${room.id.toString()}`
            );
        }

        machine.dispatch(event);

        room.changeState(machine.getCurrentState(), machine.getSnapshot());

        await this.roomRepository.save(room);

        return room;
    }

    private createRoomMachine(room: Room): RoomMachine {
        return this.roomMachineFactory.create({
            roomId: room.id,
            stateSnapshot: room.stateSnapshot,
            onTimeoutTransition: this.handleStateTimeout.bind(this),
        });
    }

    private async handleStateTimeout({
        roomId,
        newState,
        event,
        stateSnapshot,
    }: TimeoutTransitionPayload): Promise<void> {
        const room = await this.roomRepository.findById(roomId);

        if (room === null) {
            throw new Error(`Room not found: ${roomId.toString()}`);
        }

        switch (event) {
            case RoomStateEvent.CLEANING_TIMEOUT:
                await this.handleCleaningTimeout(roomId);

                break;

            case RoomStateEvent.DEEP_CLEANING_TIMEOUT:
                await this.handleDeepCleaningTimeout(roomId);

                break;

            case RoomStateEvent.INSPECTION_TIMEOUT:
                await this.handleInspectionTimeout(roomId);

                break;

            case RoomStateEvent.AUDIT_TIMEOUT:
                await this.handleAuditTimeout(roomId);

                break;
        }

        room.changeState(newState, stateSnapshot);

        await this.roomRepository.save(room);

        this.eventDispatcher.dispatch(unknownActor, room);
    }

    private async handleCleaningTimeout(roomId: RoomId): Promise<void> {
        const cleaning = await this.cleaningRepository.findByRoom(roomId);

        if (!cleaning) {
            throw new Error(`Cleaning not found for room ${roomId.toString()}`);
        }

        cleaning.finish({endReason: CleaningEndReasonType.EXPIRED});

        await this.cleaningRepository.save(cleaning);

        this.eventDispatcher.dispatch(unknownActor, cleaning);
    }

    private async handleDeepCleaningTimeout(roomId: RoomId): Promise<void> {
        const deepCleaning = await this.deepCleaningRepository.findByRoom(roomId);

        if (!deepCleaning) {
            throw new Error(`Deep cleaning not found for room ${roomId.toString()}`);
        }

        deepCleaning.finish({endReason: DeepCleaningEndReasonType.EXPIRED});

        await this.deepCleaningRepository.save(deepCleaning);

        this.eventDispatcher.dispatch(unknownActor, deepCleaning);
    }

    private async handleInspectionTimeout(roomId: RoomId): Promise<void> {
        const inspection = await this.inspectionRepository.findByRoom(roomId);

        if (!inspection) {
            throw new Error(`Inspection not found for room ${roomId.toString()}`);
        }

        inspection.finish({endReason: InspectionEndReasonType.EXPIRED});

        await this.inspectionRepository.save(inspection);

        this.eventDispatcher.dispatch(unknownActor, inspection);
    }

    private async handleAuditTimeout(roomId: RoomId): Promise<void> {
        const audit = await this.auditRepository.findByRoom(roomId);

        if (!audit) {
            throw new Error(`Audit not found for room ${roomId.toString()}`);
        }

        audit.finish({endReason: AuditEndReasonType.EXPIRED});

        await this.auditRepository.save(audit);

        this.eventDispatcher.dispatch(unknownActor, audit);
    }
}
