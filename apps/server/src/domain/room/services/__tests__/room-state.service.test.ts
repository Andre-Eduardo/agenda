import {mock} from 'jest-mock-extended';
import {unknownActor} from '../../../@shared/actor';
import type {AuditRepository} from '../../../audit/audit.repository';
import {AuditEndReasonType} from '../../../audit/entities';
import {fakeAudit} from '../../../audit/entities/__tests__/fake-audit';
import type {CleaningRepository} from '../../../cleaning/cleaning.repository';
import {CleaningEndReasonType} from '../../../cleaning/entities';
import {fakeCleaning} from '../../../cleaning/entities/__tests__/fake-cleaning';
import type {DeepCleaningRepository} from '../../../deep-cleaning/deep-cleaning.repository';
import {DeepCleaningEndReasonType} from '../../../deep-cleaning/entities';
import {fakeDeepCleaning} from '../../../deep-cleaning/entities/__tests__/fake-deep-cleaning';
import type {EventDispatcher} from '../../../event';
import {InspectionEndReasonType} from '../../../inspection/entities';
import {fakeInspection} from '../../../inspection/entities/__tests__/fake-inspection';
import type {InspectionRepository} from '../../../inspection/inspection.repository';
import {fakeRoom} from '../../entities/__tests__/fake-room';
import {RoomState, RoomStateEvent} from '../../models/room-state';
import type {RoomRepository} from '../../room.repository';
import type {RoomMachine, RoomMachineFactory} from '../../state-machine';
import {RoomStateService} from '../room-state.service';

describe('A room-state service', () => {
    const roomRepository = mock<RoomRepository>();
    const roomMachineFactory = mock<RoomMachineFactory>();
    const cleaningRepository = mock<CleaningRepository>();
    const inspectionRepository = mock<InspectionRepository>();
    const deepCleaningRepository = mock<DeepCleaningRepository>();
    const auditRepository = mock<AuditRepository>();
    const eventDispatcher = mock<EventDispatcher>();

    let roomStateService: RoomStateService;

    beforeEach(() => {
        roomStateService = new RoomStateService(
            roomRepository,
            roomMachineFactory,
            cleaningRepository,
            deepCleaningRepository,
            inspectionRepository,
            auditRepository,
            eventDispatcher
        );
    });

    const room = fakeRoom();

    describe('on room state changing', () => {
        it('should change the state of a given room', async () => {
            const stateSnapshot = {foo: 'bar'};

            const roomMachine = mock<RoomMachine>({
                can: jest.fn().mockReturnValue(true),
                getCurrentState: jest.fn().mockReturnValue(RoomState.OCCUPIED),
                getSnapshot: jest.fn().mockReturnValue(stateSnapshot),
            });

            jest.spyOn(roomMachineFactory, 'create').mockReturnValueOnce(roomMachine);

            jest.spyOn(roomRepository, 'findById').mockResolvedValueOnce(room);

            const newState = RoomState.OCCUPIED;

            await expect(roomStateService.changeRoomState(room, {type: RoomStateEvent.CHECK_IN})).resolves.toBe(room);

            expect(roomMachine.dispatch).toHaveBeenCalledWith({type: RoomStateEvent.CHECK_IN});
            expect(room.state).toBe(newState);
            expect(room.stateSnapshot).toBe(stateSnapshot);
            expect(roomRepository.save).toHaveBeenCalledWith(room);
        });

        it('should change the state of a given room ID', async () => {
            const stateSnapshot = {foo: 'bar'};

            const roomMachine = mock<RoomMachine>({
                can: jest.fn().mockReturnValue(true),
                getCurrentState: jest.fn().mockReturnValue(RoomState.OCCUPIED),
                getSnapshot: jest.fn().mockReturnValue(stateSnapshot),
            });

            jest.spyOn(roomMachineFactory, 'create').mockReturnValueOnce(roomMachine);

            jest.spyOn(roomRepository, 'findById').mockResolvedValueOnce(room);

            const newState = RoomState.OCCUPIED;

            await expect(roomStateService.changeRoomState(room.id, {type: RoomStateEvent.CHECK_IN})).resolves.toBe(
                room
            );

            expect(roomMachine.dispatch).toHaveBeenCalledWith({type: RoomStateEvent.CHECK_IN});
            expect(room.state).toBe(newState);
            expect(room.stateSnapshot).toBe(stateSnapshot);
            expect(roomRepository.save).toHaveBeenCalledWith(room);
        });

        it('should fail if the room does not exist', async () => {
            jest.spyOn(roomRepository, 'findById').mockResolvedValueOnce(null);

            await expect(
                roomStateService.changeRoomState(room.id, {type: RoomStateEvent.CHECK_IN})
            ).rejects.toThrowWithMessage(Error, 'Room not found');
        });

        it('should fail if the event is not valid for the current state', async () => {
            const roomMachine = mock<RoomMachine>({
                can: jest.fn().mockReturnValue(false),
                getCurrentState: jest.fn().mockReturnValue(RoomState.OCCUPIED),
            });

            jest.spyOn(roomMachineFactory, 'create').mockReturnValueOnce(roomMachine);

            jest.spyOn(roomRepository, 'findById').mockResolvedValueOnce(room);

            await expect(
                roomStateService.changeRoomState(room.id, {type: RoomStateEvent.CHECK_IN})
            ).rejects.toThrowWithMessage(
                Error,
                `The event CHECK_IN is not valid for the current state OCCUPIED of the room ${room.id}`
            );
        });
    });

    describe('on room state timeout', () => {
        it('should fail if the room does not exist', async () => {
            const roomMachine = mock<RoomMachine>({
                can: jest.fn().mockReturnValue(true),
                getCurrentState: jest.fn().mockReturnValue(RoomState.OCCUPIED),
                getSnapshot: jest.fn().mockReturnValue({foo: 'bar'}),
            });

            jest.spyOn(roomMachineFactory, 'create').mockReturnValueOnce(roomMachine);

            jest.spyOn(roomRepository, 'findById').mockResolvedValueOnce(room).mockResolvedValueOnce(null);

            await roomStateService.changeRoomState(room.id, {type: RoomStateEvent.CHECK_IN});

            await expect(
                roomMachineFactory.create.mock.calls[0][0].onTimeoutTransition({
                    roomId: room.id,
                    newState: RoomState.OCCUPIED,
                    event: RoomStateEvent.CHECKOUT_TIMEOUT,
                    stateSnapshot: {},
                })
            ).rejects.toThrowWithMessage(Error, `Room not found: ${room.id}`);
        });

        it('should change the state of the room', async () => {
            const stateSnapshot = {foo: 'bar'};

            const roomMachine = mock<RoomMachine>({
                can: jest.fn().mockReturnValue(true),
                getCurrentState: jest.fn().mockReturnValue(RoomState.OCCUPIED),
                getSnapshot: jest.fn().mockReturnValue(stateSnapshot),
            });

            jest.spyOn(roomMachineFactory, 'create').mockReturnValueOnce(roomMachine);

            jest.spyOn(roomRepository, 'findById').mockResolvedValue(room);

            await roomStateService.changeRoomState(room.id, {type: RoomStateEvent.CHECK_IN});

            const newState = RoomState.OCCUPIED;

            await roomMachineFactory.create.mock.calls[0][0].onTimeoutTransition({
                roomId: room.id,
                newState,
                event: RoomStateEvent.CHECKOUT_TIMEOUT,
                stateSnapshot,
            });

            expect(room.state).toBe(newState);
            expect(room.stateSnapshot).toBe(stateSnapshot);

            expect(roomRepository.save).toHaveBeenCalledWith(room);
            expect(eventDispatcher.dispatch).toHaveBeenCalledWith(unknownActor, room);
        });

        it('should process a cleaning timeout', async () => {
            const cleaning = fakeCleaning({roomId: room.id});

            const roomMachine = mock<RoomMachine>({
                can: jest.fn().mockReturnValue(true),
                getCurrentState: jest.fn().mockReturnValue(RoomState.CLEANING),
                getSnapshot: jest.fn().mockReturnValue({}),
            });

            jest.spyOn(roomMachineFactory, 'create').mockReturnValueOnce(roomMachine);

            jest.spyOn(roomRepository, 'findById').mockResolvedValue(room);

            jest.spyOn(cleaningRepository, 'findByRoom').mockResolvedValueOnce(cleaning);

            jest.spyOn(cleaning, 'finish');

            await roomStateService.changeRoomState(room.id, {
                type: RoomStateEvent.PERFORM_CLEANING,
                cleaningTimeout: 10,
            });

            await roomMachineFactory.create.mock.calls[0][0].onTimeoutTransition({
                roomId: room.id,
                newState: RoomState.DIRTY,
                event: RoomStateEvent.CLEANING_TIMEOUT,
                stateSnapshot: {},
            });

            expect(room.state).toBe(RoomState.DIRTY);

            expect(cleaning.finish).toHaveBeenCalledWith({endReason: CleaningEndReasonType.EXPIRED});

            expect(cleaningRepository.findByRoom).toHaveBeenCalledWith(room.id);
            expect(cleaningRepository.save).toHaveBeenCalledWith(cleaning);
            expect(roomRepository.save).toHaveBeenCalledWith(room);
            expect(eventDispatcher.dispatch).toHaveBeenCalledWith(unknownActor, room);
            expect(eventDispatcher.dispatch).toHaveBeenCalledWith(unknownActor, cleaning);
        });

        it('should fail to process a cleaning timeout if no cleaning exists for the room', async () => {
            const roomMachine = mock<RoomMachine>({
                can: jest.fn().mockReturnValue(true),
                getCurrentState: jest.fn().mockReturnValue(RoomState.CLEANING),
                getSnapshot: jest.fn().mockReturnValue({}),
            });

            jest.spyOn(roomMachineFactory, 'create').mockReturnValueOnce(roomMachine);

            jest.spyOn(roomRepository, 'findById').mockResolvedValue(room);

            jest.spyOn(cleaningRepository, 'findByRoom').mockResolvedValueOnce(null);

            await roomStateService.changeRoomState(room.id, {
                type: RoomStateEvent.PERFORM_CLEANING,
                cleaningTimeout: 10,
            });

            await expect(
                roomMachineFactory.create.mock.calls[0][0].onTimeoutTransition({
                    roomId: room.id,
                    newState: RoomState.DIRTY,
                    event: RoomStateEvent.CLEANING_TIMEOUT,
                    stateSnapshot: {},
                })
            ).rejects.toThrowWithMessage(Error, `Cleaning not found for room ${room.id}`);

            expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        });

        it('should process a deep cleaning timeout', async () => {
            const deepCleaning = fakeDeepCleaning({roomId: room.id});

            const roomMachine = mock<RoomMachine>({
                can: jest.fn().mockReturnValue(true),
                getCurrentState: jest.fn().mockReturnValue(RoomState.DEEP_CLEANING),
                getSnapshot: jest.fn().mockReturnValue({}),
            });

            jest.spyOn(roomMachineFactory, 'create').mockReturnValueOnce(roomMachine);

            jest.spyOn(roomRepository, 'findById').mockResolvedValue(room);

            jest.spyOn(deepCleaningRepository, 'findByRoom').mockResolvedValueOnce(deepCleaning);

            jest.spyOn(deepCleaning, 'finish');

            await roomStateService.changeRoomState(room.id, {
                type: RoomStateEvent.PERFORM_DEEP_CLEANING,
                deepCleaningTimeout: 10,
            });

            await roomMachineFactory.create.mock.calls[0][0].onTimeoutTransition({
                roomId: room.id,
                newState: RoomState.DIRTY,
                event: RoomStateEvent.DEEP_CLEANING_TIMEOUT,
                stateSnapshot: {},
            });

            expect(room.state).toBe(RoomState.DIRTY);

            expect(deepCleaning.finish).toHaveBeenCalledWith({endReason: DeepCleaningEndReasonType.EXPIRED});

            expect(deepCleaningRepository.findByRoom).toHaveBeenCalledWith(room.id);
            expect(deepCleaningRepository.save).toHaveBeenCalledWith(deepCleaning);
            expect(roomRepository.save).toHaveBeenCalledWith(room);
            expect(eventDispatcher.dispatch).toHaveBeenCalledWith(unknownActor, room);
            expect(eventDispatcher.dispatch).toHaveBeenCalledWith(unknownActor, deepCleaning);
        });

        it('should fail to process a deep cleaning timeout if no deep cleaning exists for the room', async () => {
            const roomMachine = mock<RoomMachine>({
                can: jest.fn().mockReturnValue(true),
                getCurrentState: jest.fn().mockReturnValue(RoomState.DEEP_CLEANING),
                getSnapshot: jest.fn().mockReturnValue({}),
            });

            jest.spyOn(roomMachineFactory, 'create').mockReturnValueOnce(roomMachine);

            jest.spyOn(roomRepository, 'findById').mockResolvedValue(room);

            jest.spyOn(deepCleaningRepository, 'findByRoom').mockResolvedValueOnce(null);

            await roomStateService.changeRoomState(room.id, {
                type: RoomStateEvent.PERFORM_DEEP_CLEANING,
                deepCleaningTimeout: 10,
            });

            await expect(
                roomMachineFactory.create.mock.calls[0][0].onTimeoutTransition({
                    roomId: room.id,
                    newState: RoomState.DIRTY,
                    event: RoomStateEvent.DEEP_CLEANING_TIMEOUT,
                    stateSnapshot: {},
                })
            ).rejects.toThrowWithMessage(Error, `Deep cleaning not found for room ${room.id}`);

            expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        });

        it('should process a inspection timeout', async () => {
            const inspection = fakeInspection({roomId: room.id});

            const roomMachine = mock<RoomMachine>({
                can: jest.fn().mockReturnValue(true),
                getCurrentState: jest.fn().mockReturnValue(RoomState.INSPECTION),
                getSnapshot: jest.fn().mockReturnValue({}),
            });

            jest.spyOn(roomMachineFactory, 'create').mockReturnValueOnce(roomMachine);

            jest.spyOn(roomRepository, 'findById').mockResolvedValue(room);

            jest.spyOn(inspectionRepository, 'findByRoom').mockResolvedValueOnce(inspection);

            jest.spyOn(inspection, 'finish');

            await roomStateService.changeRoomState(room.id, {
                type: RoomStateEvent.COMPLETE_CLEANING,
                inspectionEnabled: true,
                inspectionTimeout: 10,
                autoRentWhenCarInGarage: false,
            });

            await roomMachineFactory.create.mock.calls[0][0].onTimeoutTransition({
                roomId: room.id,
                newState: RoomState.VACANT,
                event: RoomStateEvent.INSPECTION_TIMEOUT,
                stateSnapshot: {},
            });

            expect(room.state).toBe(RoomState.VACANT);

            expect(inspection.finish).toHaveBeenCalledWith({endReason: InspectionEndReasonType.EXPIRED});

            expect(inspectionRepository.findByRoom).toHaveBeenCalledWith(room.id);
            expect(inspectionRepository.save).toHaveBeenCalledWith(inspection);
            expect(roomRepository.save).toHaveBeenCalledWith(room);
            expect(eventDispatcher.dispatch).toHaveBeenCalledWith(unknownActor, room);
            expect(eventDispatcher.dispatch).toHaveBeenCalledWith(unknownActor, inspection);
        });

        it('should fail to process a inspection timeout if no inspection exists for the room', async () => {
            const roomMachine = mock<RoomMachine>({
                can: jest.fn().mockReturnValue(true),
                getCurrentState: jest.fn().mockReturnValue(RoomState.INSPECTION),
                getSnapshot: jest.fn().mockReturnValue({}),
            });

            jest.spyOn(roomMachineFactory, 'create').mockReturnValueOnce(roomMachine);

            jest.spyOn(roomRepository, 'findById').mockResolvedValue(room);

            jest.spyOn(inspectionRepository, 'findByRoom').mockResolvedValueOnce(null);

            await roomStateService.changeRoomState(room.id, {
                type: RoomStateEvent.COMPLETE_CLEANING,
                inspectionEnabled: true,
                inspectionTimeout: 10,
                autoRentWhenCarInGarage: false,
            });

            await expect(
                roomMachineFactory.create.mock.calls[0][0].onTimeoutTransition({
                    roomId: room.id,
                    newState: RoomState.VACANT,
                    event: RoomStateEvent.INSPECTION_TIMEOUT,
                    stateSnapshot: {},
                })
            ).rejects.toThrowWithMessage(Error, `Inspection not found for room ${room.id}`);

            expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        });

        it('should process an audit timeout', async () => {
            const audit = fakeAudit({roomId: room.id});
            const roomMachine = mock<RoomMachine>({
                can: jest.fn().mockReturnValue(true),
                getCurrentState: jest.fn().mockReturnValue(RoomState.AUDIT),
                getSnapshot: jest.fn().mockReturnValue({}),
            });

            jest.spyOn(roomMachineFactory, 'create').mockReturnValueOnce(roomMachine);

            jest.spyOn(roomRepository, 'findById').mockResolvedValue(room);

            jest.spyOn(auditRepository, 'findByRoom').mockResolvedValueOnce(audit);

            jest.spyOn(audit, 'finish');

            await roomStateService.changeRoomState(room.id, {
                type: RoomStateEvent.AUDIT,
                auditTimeout: 10,
            });

            await roomMachineFactory.create.mock.calls[0][0].onTimeoutTransition({
                roomId: room.id,
                newState: RoomState.DIRTY,
                event: RoomStateEvent.AUDIT_TIMEOUT,
                stateSnapshot: {},
            });

            expect(room.state).toBe(RoomState.DIRTY);

            expect(audit.finish).toHaveBeenCalledWith({endReason: AuditEndReasonType.EXPIRED});

            expect(auditRepository.findByRoom).toHaveBeenCalledWith(room.id);
            expect(auditRepository.save).toHaveBeenCalledWith(audit);
            expect(roomRepository.save).toHaveBeenCalledWith(room);
            expect(eventDispatcher.dispatch).toHaveBeenCalledWith(unknownActor, room);
            expect(eventDispatcher.dispatch).toHaveBeenCalledWith(unknownActor, audit);
        });

        it('should fail to process an audit timeout if no audit exists for the room', async () => {
            const roomMachine = mock<RoomMachine>({
                can: jest.fn().mockReturnValue(true),
                getCurrentState: jest.fn().mockReturnValue(RoomState.AUDIT),
                getSnapshot: jest.fn().mockReturnValue({}),
            });

            jest.spyOn(roomMachineFactory, 'create').mockReturnValueOnce(roomMachine);

            jest.spyOn(roomRepository, 'findById').mockResolvedValue(room);

            jest.spyOn(auditRepository, 'findByRoom').mockResolvedValueOnce(null);

            await roomStateService.changeRoomState(room.id, {
                type: RoomStateEvent.AUDIT,
                auditTimeout: 10,
            });

            await expect(
                roomMachineFactory.create.mock.calls[0][0].onTimeoutTransition({
                    roomId: room.id,
                    newState: RoomState.DIRTY,
                    event: RoomStateEvent.AUDIT_TIMEOUT,
                    stateSnapshot: {},
                })
            ).rejects.toThrowWithMessage(Error, `Audit not found for room ${room.id}`);

            expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        });
    });
});
