import type {ClinicId} from '@domain/clinic/entities';
import type {Room, RoomId} from '@domain/room/entities';

export interface RoomRepository {
    findById(id: RoomId): Promise<Room | null>;
    findByClinicId(clinicId: ClinicId): Promise<Room[]>;
    save(room: Room): Promise<void>;
    delete(id: RoomId): Promise<void>;
}

export abstract class RoomRepository {}
