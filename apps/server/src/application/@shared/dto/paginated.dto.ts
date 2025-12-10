/* istanbul ignore file */

import {ApiHideProperty, ApiProperty} from '@nestjs/swagger';

export class PaginatedDto<T> {
    @ApiProperty({
        description: 'The total number of items',
        example: 100,
    })
    totalCount!: number;

    @ApiHideProperty()
    data!: T[];
}
