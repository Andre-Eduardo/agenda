import {z} from 'zod';
import {PersonId} from '../../../domain/person/entities';
import type {DirectSaleSortOptions} from '../../../domain/sale/direct-sale.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';
import {listSaleSchema} from './list-sale.dto';

const listDirectSaleSchema = listSaleSchema.extend({
    buyerId: z
        .preprocess((value) => (value === '' ? null : value), entityId(PersonId).nullish())
        .openapi({description: 'The buyer ID to search for'}),
    pagination: pagination(<DirectSaleSortOptions>['createdAt', 'updatedAt']),
});

export class ListDirectSaleDto extends createZodDto(listDirectSaleSchema) {}
