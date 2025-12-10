import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {User} from '../../../domain/user/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'User'})
export class UserDto extends EntityDto {
    @ApiProperty({
        description: 'The username of the user',
        example: 'john.doe',
    })
    username: string;

    @ApiProperty({
        description: 'The email of the user',
        example: 'john.doe@example.com',
    })
    email: string | null;

    @ApiProperty({
        description: 'The name of the user',
        example: 'John',
    })
    name!: string;


    constructor(user: User) {
        super(user);
        this.username = user.username.toString();
        this.email = user.email?.toString() ?? null;
        this.name = user.name;
    }
}
