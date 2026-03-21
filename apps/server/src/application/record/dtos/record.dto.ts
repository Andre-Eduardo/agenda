import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {Record} from '../../../domain/record/entities';
import {EntityDto} from '../../@shared/dto';

class FileDto {
    @ApiProperty({format: 'uuid'})
    id: string;

    @ApiProperty()
    fileName: string;

    @ApiProperty()
    url: string;

    @ApiProperty()
    description: string;

    constructor(file: Record['files'][number]) {
        this.id = file.id.toString();
        this.fileName = file.fileName;
        this.url = file.url;
        this.description = file.description;
    }
}

@ApiSchema({name: 'Record'})
export class RecordDto extends EntityDto {
    @ApiProperty({format: 'uuid', description: 'The patient ID'})
    patientId: string;

    @ApiProperty({format: 'uuid', description: 'The professional ID'})
    professionalId: string;

    @ApiProperty({description: 'The record description'})
    description: string;

    @ApiProperty({type: [FileDto], description: 'The attached files'})
    files: FileDto[];

    constructor(record: Record) {
        super(record);
        this.patientId = record.patientId.toString();
        this.professionalId = record.professionalId.toString();
        this.description = record.description;
        this.files = record.files.map((f) => new FileDto(f));
    }
}
