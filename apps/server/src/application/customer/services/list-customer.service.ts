import {Injectable} from '@nestjs/common';
import {CustomerRepository} from '../../../domain/customer/customer.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {CustomerDto, ListCustomerDto} from '../dtos';

@Injectable()
export class ListCustomerService implements ApplicationService<ListCustomerDto, PaginatedDto<CustomerDto>> {
    constructor(private readonly customerRepository: CustomerRepository) {}

    async execute({payload}: Command<ListCustomerDto>): Promise<PaginatedDto<CustomerDto>> {
        const result = await this.customerRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                name: payload.name,
                documentId: payload.documentId,
                phone: payload.phone,
                companyName: payload.companyName,
                personType: payload.personType,
                profiles: payload.profiles,
                gender: payload.gender,
            }
        );

        return {
            ...result,
            data: result.data.map((customer) => new CustomerDto(customer)),
        };
    }
}
