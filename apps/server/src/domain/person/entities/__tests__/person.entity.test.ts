import {InvalidInputException} from '../../../@shared/exceptions';
import {DocumentId, Phone} from '../../../@shared/value-objects';
import {PersonDeletedEvent} from '../../events';
import {Gender, Person, PersonId, PersonType} from '../person.entity';
import {fakePerson} from './fake-person';

describe('A person', () => {
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on create', () => {
        it.each([
            [{name: ''}, 'Person name must be at least 1 character long.'],
            [{gender: 'UNKNOWN' as Gender}, 'Invalid gender.'],
        ])('should throw an error when receiving invalid data', (payload, expectedError) => {
            expect(() => fakePerson(payload)).toThrowWithMessage(InvalidInputException, expectedError);
        });

        it('should apply defaults for optional values', () => {
            const person = new Person({
                id: PersonId.generate(),
                name: 'John Doe',
                documentId: null,
                phone: null,
                gender: null,
                personType: PersonType.NATURAL,
                createdAt: now,
                updatedAt: now,
            });

            expect(person.documentId).toBeNull();
            expect(person.phone).toBeNull();
            expect(person.gender).toBeNull();
            expect(person.personType).toBe(PersonType.NATURAL);
            expect(person.deletedAt).toBeNull();
        });
    });

    describe('on deletion', () => {
        it('should emit a person-deleted event', () => {
            const person = fakePerson();

            person.delete();

            expect(person.deletedAt).toStrictEqual(now);
            expect(person.events).toEqual([
                {
                    type: PersonDeletedEvent.type,
                    person,
                    timestamp: now,
                },
            ]);
            expect(person.events[0]).toBeInstanceOf(PersonDeletedEvent);
        });
    });

    it.each([
        [{personType: PersonType.LEGAL, phone: Phone.create('12345678'), gender: null}, '12345678'],
        [{personType: PersonType.NATURAL, phone: Phone.create('12345678'), gender: Gender.MALE}, '12345678'],
        [{personType: PersonType.NATURAL, phone: null, gender: Gender.FEMALE}, null],
    ])('should be serializable', (values, expectedPhone) => {
        const person = fakePerson({
            ...values,
            name: 'john',
            documentId: DocumentId.create('12345678901'),
        });

        expect(person.toJSON()).toEqual({
            id: person.id.toJSON(),
            name: 'john',
            personType: person.personType,
            documentId: '12345678901',
            phone: expectedPhone,
            gender: person.gender,
            createdAt: person.createdAt.toJSON(),
            updatedAt: person.updatedAt.toJSON(),
            deletedAt: null,
        });
    });
});

describe('A person ID', () => {
    it('can be created from a string', () => {
        const uuid = '6267dbfa-177a-4596-882e-99572932ffce';
        const id = PersonId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(PersonId.generate()).toBeInstanceOf(PersonId);
    });
});
