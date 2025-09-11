import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CustomerRepository} from '../../../domain/customer/customer.repository';
import {EventDispatcher} from '../../../domain/event';
import {DuplicateDocumentIdException} from '../../../domain/person/person.exceptions';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CustomerDto, UpdateCustomerDto} from '../dtos';

@Injectable()
export class UpdateCustomerService implements ApplicationService<UpdateCustomerDto, CustomerDto> {
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateCustomerDto>): Promise<CustomerDto> {
        const customer = await this.customerRepository.findById(payload.id);

        if (customer === null) {
            throw new ResourceNotFoundException('Customer not found', payload.id.toString());
        }

        customer.change(payload);

        try {
            await this.customerRepository.save(customer);
        } catch (e) {
            if (e instanceof DuplicateDocumentIdException) {
                throw new PreconditionException('Cannot update a customer with a document ID already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, customer);

        return new CustomerDto(customer);
    }
}
