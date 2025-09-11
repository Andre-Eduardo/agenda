import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CustomerRepository} from '../../../domain/customer/customer.repository';
import {Customer} from '../../../domain/customer/entities';
import {EventDispatcher} from '../../../domain/event';
import {PersonId, PersonProfile} from '../../../domain/person/entities';
import {DuplicateDocumentIdException} from '../../../domain/person/person.exceptions';
import {PersonRepository} from '../../../domain/person/person.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateCustomerDto, CustomerDto} from '../dtos';

@Injectable()
export class CreateCustomerService implements ApplicationService<CreateCustomerDto, CustomerDto> {
    constructor(
        private readonly personRepository: PersonRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateCustomerDto>): Promise<CustomerDto> {
        const customer = 'id' in payload ? await this.createCustomerFromPerson(payload.id) : Customer.create(payload);

        try {
            await this.customerRepository.save(customer);
        } catch (e) {
            if (e instanceof DuplicateDocumentIdException) {
                throw new PreconditionException('Cannot create a customer with a document ID already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, customer);

        return new CustomerDto(customer);
    }

    private async createCustomerFromPerson(personId: PersonId): Promise<Customer> {
        const person = await this.personRepository.findById(personId);

        if (!person) {
            throw new ResourceNotFoundException('Person not found', personId.toString());
        }

        if (person.profiles.has(PersonProfile.CUSTOMER)) {
            throw new PreconditionException('The person is already a customer.');
        }

        return Customer.createFromPerson(person);
    }
}
