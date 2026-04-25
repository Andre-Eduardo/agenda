import { PaginatedList, Pagination } from '../@shared/repository';
import type {Email} from '../@shared/value-objects';
import type {User, UserId} from './entities';
import type {Username} from './value-objects';

export type UserSearchFilter = {
    ids?: UserId[];
    term?: string;
};

export type UserSortOptions = [
    'createdAt',
    'updatedAt',
];

export interface UserRepository {
    findById(id: UserId): Promise<User | null>;

    findByUsername(username: Username): Promise<User | null>;

    findByEmail(email: Email): Promise<User | null>;

    search(
        pagination: Pagination<UserSortOptions>,
        filter?: UserSearchFilter
    ): Promise<PaginatedList<User>>;

    save(user: User): Promise<void>;

    delete(id: UserId): Promise<void>;
}

export abstract class UserRepository {}
