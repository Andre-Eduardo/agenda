import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import type {UploadInfo} from '../../../domain/@shared/storage/file-storage';
import {FileStorageType} from '../../../domain/file/entities';

export class UploadInfoDto implements UploadInfo {
    @ApiProperty()
    url!: string;

    @ApiPropertyOptional()
    fields?: Record<string, string>;

    @ApiProperty({enum: ['PUT', 'POST']})
    method!: 'PUT' | 'POST';
}

export class PreparedUploadDto {
    @ApiProperty({enum: FileStorageType})
    storageType!: FileStorageType;

    @ApiProperty()
    fileId!: string;

    @ApiProperty()
    tempPath!: string;

    @ApiPropertyOptional({type: UploadInfoDto})
    upload!: UploadInfoDto | null;
}
