import type {ArgumentMetadata} from '@nestjs/common';
import {z} from 'zod';
import {createZodDto} from '../dto';
import {ZodValidationPipe} from '../index';

const testSchema = z.object({
    foo: z.number().int().positive(),
    bar: z.string().nullish(),
});

class TestDto extends createZodDto(testSchema) {}

describe('A Zod validation pipe', () => {
    it('should validate a payload by a Zod schema', () => {
        const pipe = new ZodValidationPipe(testSchema);
        const value = {
            foo: 42,
            bar: 'baz',
        };
        const metadata: ArgumentMetadata = {
            type: 'query',
            data: 'test',
        };

        expect(() => pipe.transform(value, metadata)).not.toThrow();
    });

    it('should throw an error if a payload is invalid with the given Zod schema', () => {
        const pipe = new ZodValidationPipe(testSchema);
        const value = {
            foo: 42.5,
            bar: 1,
        };
        const metadata: ArgumentMetadata = {
            type: 'param',
        };

        expect(() => pipe.transform(value, metadata)).toThrow();
    });

    it('should validate a payload by a Zod DTO', () => {
        const pipe = new ZodValidationPipe(TestDto);
        const value = {
            foo: 42,
            bar: null,
        };
        const metadata: ArgumentMetadata = {
            type: 'query',
        };

        expect(() => pipe.transform(value, metadata)).not.toThrow();
    });

    it('should throw an error if a payload is invalid with the given Zod DTO', () => {
        const pipe = new ZodValidationPipe(TestDto);
        const value = {
            foo: 42.5,
            bar: 1,
        };
        const metadata: ArgumentMetadata = {
            type: 'query',
        };

        expect(() => pipe.transform(value, metadata)).toThrow();
    });

    it('should return the payload if a schema validation is not provided', () => {
        const pipe = new ZodValidationPipe();
        const value = {
            foo: 42,
            bar: 'baz',
        };
        const metadata: ArgumentMetadata = {
            type: 'query',
        };

        expect(pipe.transform(value, metadata)).toBe(value);
    });

    it('should validate a payload using the metatype schema', () => {
        const pipe = new ZodValidationPipe();
        const value = {
            foo: 42,
            bar: 'baz',
        };
        const metadata: ArgumentMetadata = {
            type: 'query',
            metatype: TestDto,
        };

        expect(() => pipe.transform(value, metadata)).not.toThrow();
    });
});
