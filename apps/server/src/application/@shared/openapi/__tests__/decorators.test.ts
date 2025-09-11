/* eslint-disable jest/unbound-method -- To better test the decorators */
import {DECORATORS} from '@nestjs/swagger/dist/constants';
import {PaginatedDto} from '../../dto';
import {ApiProblem} from '../../exception';
import {ApiOperation, ApiPaginatedOperation} from '../decorators';

describe('ApiOperation', () => {
    class Test {
        @ApiOperation({
            summary: 'Creates a new company',
            parameters: [
                {
                    name: 'foo',
                    type: 'string',
                    required: true,
                },
            ],
            queries: [
                {
                    name: 'bar',
                    type: 'string',
                    required: false,
                    description: 'Bar',
                },
            ],
            responses: [
                {
                    status: 201,
                    description: 'Resource created',
                },
            ],
        })
        public static test1() {}

        @ApiOperation({})
        public static test2() {}
    }

    it('should create a metadata object with the correct values', () => {
        const apiExtraModels = Reflect.getMetadata(DECORATORS.API_EXTRA_MODELS, Test.test1);
        const apiOperation = Reflect.getMetadata(DECORATORS.API_OPERATION, Test.test1);
        const apiParams = Reflect.getMetadata(DECORATORS.API_PARAMETERS, Test.test1);
        const apiResponses = Reflect.getMetadata(DECORATORS.API_RESPONSE, Test.test1);

        expect(apiExtraModels).toEqual([ApiProblem]);
        expect(apiOperation).toEqual({
            summary: 'Creates a new company',
        });
        expect(apiParams).toEqual([
            {
                in: 'path',
                name: 'foo',
                required: true,
                type: 'string',
            },
            {
                in: 'query',
                name: 'bar',
                type: 'string',
                required: false,
                description: 'Bar',
            },
        ]);
        expect(apiResponses).toEqual({
            201: {
                description: 'Resource created',
            },
            default: {
                content: {
                    'application/problem+json': {
                        schema: {
                            $ref: '#/components/schemas/ApiProblem',
                        },
                    },
                },
                description: 'Request failed',
            },
        });
    });

    it('should create a metadata object when no options are provided', () => {
        const apiExtraModels = Reflect.getMetadata(DECORATORS.API_EXTRA_MODELS, Test.test2);
        const apiOperation = Reflect.getMetadata(DECORATORS.API_OPERATION, Test.test2);
        const apiParams = Reflect.getMetadata(DECORATORS.API_PARAMETERS, Test.test2);
        const apiResponses = Reflect.getMetadata(DECORATORS.API_RESPONSE, Test.test2);

        expect(apiExtraModels).toEqual([ApiProblem]);
        expect(apiOperation).toEqual({
            summary: '',
        });
        expect(apiParams).not.toBeDefined();
        expect(apiResponses).toEqual({
            default: {
                content: {
                    'application/problem+json': {
                        schema: {
                            $ref: '#/components/schemas/ApiProblem',
                        },
                    },
                },
                description: 'Request failed',
            },
        });
    });
});

describe('ApiPaginatedOperation', () => {
    class TestDto {}

    class Test {
        @ApiPaginatedOperation({
            summary: 'Search',
            responses: [
                {
                    status: 200,
                    description: 'Success',
                    model: TestDto,
                },
            ],
        })
        public static test() {}
    }

    it('should create a metadata object with the correct values', () => {
        const apiExtraModels = Reflect.getMetadata(DECORATORS.API_EXTRA_MODELS, Test.test);
        const apiOperation = Reflect.getMetadata(DECORATORS.API_OPERATION, Test.test);
        const apiParams = Reflect.getMetadata(DECORATORS.API_PARAMETERS, Test.test);
        const apiResponses = Reflect.getMetadata(DECORATORS.API_RESPONSE, Test.test);

        expect(apiExtraModels).toEqual([PaginatedDto, ApiProblem]);
        expect(apiOperation).toEqual({
            summary: 'Search',
        });
        expect(apiParams).toEqual([
            {
                in: 'query',
                name: 'pagination',
                style: 'deepObject',
                required: true,
            },
        ]);
        expect(apiResponses).toEqual({
            200: {
                schema: {
                    allOf: [
                        {
                            $ref: '#/components/schemas/PaginatedDto',
                        },
                        {
                            properties: {
                                data: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/TestDto',
                                    },
                                },
                            },
                            required: ['data'],
                        },
                    ],
                },
                description: 'Success',
            },
            default: {
                content: {
                    'application/problem+json': {
                        schema: {
                            $ref: '#/components/schemas/ApiProblem',
                        },
                    },
                },
                description: 'Request failed',
            },
        });
    });
});
