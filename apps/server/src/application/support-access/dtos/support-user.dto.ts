import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import type {User} from '@domain/user/entities';

@ApiSchema({name: 'SupportUser'})
export class SupportUserDto extends EntityDto {
    @ApiProperty({description: 'The username of the support user', example: 'suporte.ana'})
    username: string;

    @ApiProperty({type: String, nullable: true, description: 'The email of the support user'})
    email: string | null;

    @ApiProperty({description: 'The name of the support user', example: 'Ana (Suporte)'})
    name: string;

    constructor(user: User) {
        super(user);
        this.username = user.username.toString();
        this.email = user.email?.toString() ?? null;
        this.name = user.name;
    }
}
