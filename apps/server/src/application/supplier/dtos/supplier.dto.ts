import {ApiSchema} from '@nestjs/swagger';
import {PersonDto} from '../../person/dtos';

@ApiSchema({name: 'Supplier'})
export class SupplierDto extends PersonDto {}
