import type {WorkingHours, WorkingHoursId} from './entities';
import type {ProfessionalId} from './entities';

export interface WorkingHoursRepository {
    findById(id: WorkingHoursId): Promise<WorkingHours | null>;

    findByProfessionalAndDay(professionalId: ProfessionalId, dayOfWeek: number): Promise<WorkingHours[]>;

    save(workingHours: WorkingHours): Promise<void>;

    delete(id: WorkingHoursId): Promise<void>;
}

export abstract class WorkingHoursRepository {}
