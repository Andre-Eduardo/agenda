import type {Email} from '../@shared/value-objects';
import type {PersonId} from '../person/entities';
import type {User, UserId} from './entities';
import type {Username} from './value-objects';

export interface UserRepository {
    findById(id: UserId): Promise<User | null>;

    findByUsername(username: Username): Promise<User | null>;

    findByEmail(email: Email): Promise<User | null>;

    findByEmployeeId(employeeId: PersonId): Promise<User | null>;

    save(user: User): Promise<void>;

    delete(id: UserId): Promise<void>;
}

export abstract class UserRepository {}
