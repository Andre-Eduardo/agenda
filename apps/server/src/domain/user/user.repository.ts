import { PaginatedList, Pagination } from "@domain/@shared/repository";
import type { Email } from "@domain/@shared/value-objects";
import type { User, UserId } from "@domain/user/entities";
import type { Username } from "@domain/user/value-objects";

export type UserSearchFilter = {
  ids?: UserId[];
  term?: string;
};

export type UserSortOptions = ["createdAt", "updatedAt"];

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;

  findByUsername(username: Username): Promise<User | null>;

  findByEmail(email: Email): Promise<User | null>;

  search(
    pagination: Pagination<UserSortOptions>,
    filter?: UserSearchFilter,
  ): Promise<PaginatedList<User>>;

  save(user: User): Promise<void>;

  delete(id: UserId): Promise<void>;
}

export abstract class UserRepository {}
