import { PaginatedList, Pagination } from '@domain/@shared/repository';
import type {Gender, Person, PersonId} from './entities';
import { Phone } from '@domain/@shared/value-objects';


export type PersonSearchFilter = {
    ids?: PersonId[];
    name?: string;
    documentId?: string;
    phone?: Phone;
    gender?: Gender;
};
export type PersonSortOptions = [
    'name',
    'documentId',
    'gender',
    'createdAt',
    'updatedAt',
];

export interface PersonRepository {
    findById(id: PersonId): Promise<Person | null>;

    delete(id: PersonId): Promise<void>;

    search(
        pagination: Pagination<PersonSortOptions>,
        filter?: PersonSearchFilter
    ): Promise<PaginatedList<Person>>;

    save(person: Person): Promise<void>;
}

export abstract class PersonRepository {}
