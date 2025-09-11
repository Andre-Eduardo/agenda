import type {SupplierSortOptions} from '../../../domain/supplier/supplier.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {pagination} from '../../@shared/validation/schemas';
import {listPersonSchema} from '../../person/dtos';

const listSupplierSchema = listPersonSchema.extend({
    pagination: pagination(<SupplierSortOptions>[
        'name',
        'companyName',
        'personType',
        'gender',
        'createdAt',
        'updatedAt',
    ]),
});

export class ListSupplierDto extends createZodDto(listSupplierSchema) {}
