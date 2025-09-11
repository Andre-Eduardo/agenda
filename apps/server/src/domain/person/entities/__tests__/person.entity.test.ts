import {InvalidInputException} from '../../../@shared/exceptions';
import {DocumentId, Phone} from '../../../@shared/value-objects';
import {Gender, PersonId, PersonProfile, PersonType} from '../person.entity';
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
            [{name: '', profiles: new Set([PersonProfile.CUSTOMER])}, 'Person name must be at least 1 character long.'],
            [{name: '', profiles: new Set([PersonProfile.EMPLOYEE])}, 'Person name must be at least 1 character long.'],
            [{companyName: 'company', personType: PersonType.NATURAL}, 'Only legal persons can have a company name.'],
            [{gender: Gender.MALE, personType: PersonType.LEGAL}, 'Only natural persons can have a gender.'],
        ])('should throw an error when receiving invalid data', (payload, expectedError) => {
            const data = {
                ...payload,
            };

            expect(() => fakePerson(data)).toThrowWithMessage(InvalidInputException, expectedError);
        });
    });

    it.each([
        [
            {
                personType: PersonType.LEGAL,
                phone: Phone.create('12345678'),
                companyName: 'company',
            },
            '12345678',
        ],
        [
            {
                personType: PersonType.NATURAL,
                phone: Phone.create('12345678'),
                gender: Gender.MALE,
            },
            '12345678',
        ],
        [
            {
                personType: PersonType.NATURAL,
                phone: null,
                gender: Gender.MALE,
            },
            null,
        ],
    ])('should be serializable', (values, expectedPhone) => {
        const person = fakePerson({
            ...values,
            name: 'john',
            profiles: new Set([PersonProfile.CUSTOMER]),
            documentId: DocumentId.create('12345678901'),
        });

        expect(person.toJSON()).toEqual({
            id: person.id.toJSON(),
            name: 'john',
            companyName: person.companyName,
            companyId: person.companyId.toJSON(),
            profiles: ['CUSTOMER'],
            personType: person.personType,
            documentId: '12345678901',
            phone: expectedPhone,
            gender: person.gender,
            createdAt: person.createdAt.toJSON(),
            updatedAt: person.updatedAt.toJSON(),
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
