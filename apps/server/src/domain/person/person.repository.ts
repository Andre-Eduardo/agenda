import type {Person, PersonId} from './entities';

export interface PersonRepository {
    findById(id: PersonId): Promise<Person | null>;

    delete(id: PersonId): Promise<void>;
}

export abstract class PersonRepository {}
