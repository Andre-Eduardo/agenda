import {ApiSchema} from '@nestjs/swagger';
import {PersonDto} from '../../person/dtos';

@ApiSchema({name: 'Customer'})
export class CustomerDto extends PersonDto {}
