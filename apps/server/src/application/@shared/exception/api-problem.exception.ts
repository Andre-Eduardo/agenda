// For reference, see https://www.rfc-editor.org/rfc/rfc9457
import {HttpStatus} from '@nestjs/common/enums/http-status.enum';
import {ApiProperty} from '@nestjs/swagger';

export class ApiProblem<T extends string = string> {
    @ApiProperty({
        description: 'A short, human-readable summary of the problem',
        example: 'Invalid input',
    })
    title!: string;

    @ApiProperty({
        format: 'uri',
        description: 'A URI reference that identifies the problem type',
        example: 'https://developer.mozilla.org/docs/Web/HTTP/Status/400',
    })
    type!: T;

    @ApiProperty({
        description: 'A human-readable explanation specific to this occurrence of the problem',
        example: 'The ID is required',
    })
    detail!: string;

    @ApiProperty({
        description: 'The HTTP status code',
        example: 400,
        enum: Object.values(HttpStatus).filter((status) => typeof status === 'number' && (status as number) >= 400),
    })
    status!: number;

    @ApiProperty({
        description: 'A URI reference that identifies the specific occurrence of the problem',
        example: '/api/example/12345',
    })
    instance!: string;
}

export interface UnexpectedErrorFormatter<T extends ApiProblem> {
    unexpectedError(): T;
}

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';
export const PROBLEM_URI = 'https://developer.mozilla.org/docs/Web/HTTP/Status/';
