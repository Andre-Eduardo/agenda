import {PaginatedList, Pagination} from '@domain/@shared/repository';
import type {Appointment, AppointmentId, AppointmentStatus} from '@domain/appointment/entities';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {PatientId} from '@domain/patient/entities';
import type {RoomId} from '@domain/room/entities';

export type AppointmentSearchFilter = {
    ids?: AppointmentId[];
    term?: string;
    clinicId?: ClinicId;
    attendedByMemberId?: ClinicMemberId;
    createdByMemberId?: ClinicMemberId;
    patientId?: PatientId;
    status?: AppointmentStatus[];
    dateFrom?: Date;
    dateTo?: Date;
};

export type AppointmentSortOptions = ['createdAt', 'updatedAt', 'startAt'];

export interface AppointmentRepository {
    findById(id: AppointmentId): Promise<Appointment | null>;

    delete(id: AppointmentId): Promise<void>;

    search(
        pagination: Pagination<AppointmentSortOptions>,
        filter?: AppointmentSearchFilter
    ): Promise<PaginatedList<Appointment>>;

    save(appointment: Appointment): Promise<void>;

    findConflicts(
        attendedByMemberId: ClinicMemberId,
        startAt: Date,
        endAt: Date,
        excludeId?: AppointmentId
    ): Promise<Appointment[]>;

    findRoomConflicts(roomId: RoomId, startAt: Date, endAt: Date, excludeId?: AppointmentId): Promise<Appointment[]>;

    /**
     * Acquires a Postgres advisory lock (transaction-scoped) for the given member's schedule.
     * Must be called within a `@Transactional()` context — the lock is released automatically
     * on commit/rollback. Serializes concurrent create/update calls for the same member so the
     * subsequent conflict check is race-free.
     */
    lockMemberSchedule(attendedByMemberId: ClinicMemberId): Promise<void>;

    /** Same as {@link lockMemberSchedule}, but scoped to a room's schedule. */
    lockRoomSchedule(roomId: RoomId): Promise<void>;
}

export abstract class AppointmentRepository {}
