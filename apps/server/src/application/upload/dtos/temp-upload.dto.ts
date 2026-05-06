import {ApiProperty} from '@nestjs/swagger';

export class TempUploadDto {
    @ApiProperty()
    fileId!: string;

    @ApiProperty()
    tempPath!: string;
}
