import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CustomerRepository} from '../../../domain/customer/customer.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetCustomerDto, CustomerDto} from '../dtos';

@Injectable()
export class GetCustomerService implements ApplicationService<GetCustomerDto, CustomerDto> {
    constructor(private readonly customerRepository: CustomerRepository) {}

    async execute({payload}: Command<GetCustomerDto>): Promise<CustomerDto> {
        const customer = await this.customerRepository.findById(payload.id);

        if (!customer) {
            throw new ResourceNotFoundException('Customer not found', payload.id.toString());
        }

        return new CustomerDto(customer);
    }
}
