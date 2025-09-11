import type {CustomerSortOptions} from '../../../domain/customer/customer.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {pagination} from '../../@shared/validation/schemas';
import {listPersonSchema} from '../../person/dtos';

const listCustomerSchema = listPersonSchema.extend({
    pagination: pagination(<CustomerSortOptions>[
        'name',
        'companyName',
        'personType',
        'gender',
        'createdAt',
        'updatedAt',
    ]),
});

export class ListCustomerDto extends createZodDto(listCustomerSchema) {}
