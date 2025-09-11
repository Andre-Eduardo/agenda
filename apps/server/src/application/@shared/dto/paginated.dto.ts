import {ApiHideProperty, ApiProperty} from '@nestjs/swagger';

export class PaginatedDto<T> {
    @ApiProperty({
        description: 'The total number of items',
        example: 100,
    })
    totalCount!: number;

    @ApiProperty({
        description: 'The cursor for the next page',
        format: 'uuid',
    })
    nextCursor!: string | null;

    @ApiHideProperty()
    data!: T[];
}
