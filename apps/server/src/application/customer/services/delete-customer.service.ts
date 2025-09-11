import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CustomerRepository} from '../../../domain/customer/customer.repository';
import {EventDispatcher} from '../../../domain/event';
import {PersonRepository} from '../../../domain/person/person.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteCustomerDto} from '../dtos';

@Injectable()
export class DeleteCustomerService implements ApplicationService<DeleteCustomerDto> {
    constructor(
        private readonly personRepository: PersonRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteCustomerDto>): Promise<void> {
        const customer = await this.customerRepository.findById(payload.id);

        if (!customer) {
            throw new ResourceNotFoundException('Customer not found', payload.id.toString());
        }

        customer.delete();

        // Required to update the person's profiles.
        await this.customerRepository.save(customer);

        await this.customerRepository.delete(payload.id);

        if (customer.profiles.size === 0) {
            await this.personRepository.delete(payload.id);
        }

        this.eventDispatcher.dispatch(actor, customer);
    }
}
