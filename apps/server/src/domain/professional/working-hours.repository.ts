import type {ClinicMemberId} from '../clinic-member/entities';
import type {WorkingHours, WorkingHoursId} from './entities';

export interface WorkingHoursRepository {
    findById(id: WorkingHoursId): Promise<WorkingHours | null>;

    findByMemberAndDay(clinicMemberId: ClinicMemberId, dayOfWeek: number): Promise<WorkingHours[]>;

    save(workingHours: WorkingHours): Promise<void>;

    delete(id: WorkingHoursId): Promise<void>;
}

export abstract class WorkingHoursRepository {}
