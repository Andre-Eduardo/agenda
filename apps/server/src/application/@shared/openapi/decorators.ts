import type { Type } from "@nestjs/common";
import { applyDecorators } from "@nestjs/common";
import {
  ApiConsumes,
  ApiExtraModels,
  ApiOperation as NestApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import type {
  ApiOperationOptions as NestApiOperationOptions,
  ApiParamOptions,
  ApiResponseOptions,
  ApiQueryOptions,
} from "@nestjs/swagger";
import { PaginatedDto } from "@application/@shared/dto";
import { ApiProblem } from "@application/@shared/exception";

type ApiOperationOptions = Override<
  NestApiOperationOptions,
  {
    parameters?: ApiParamOptions[];
    queries?: ApiQueryOptions[];
    consumes?: string[];
    responses?: ApiResponseOptions[];
  }
>;

export const ApiOperation = (options: ApiOperationOptions) => {
  const { parameters, queries, consumes, responses, ...otherOptions } = options;

  const apiConsumes = consumes ? [ApiConsumes(...consumes)] : [];
  const apiParams = parameters?.map((parameter) => ApiParam(parameter)) ?? [];
  const apiQueries = queries?.map((query) => ApiQuery(query)) ?? [];
  const apiResponses = responses?.map((response) => ApiResponse(response)) ?? [];

  return applyDecorators(
    ApiExtraModels(ApiProblem),
    NestApiOperation(otherOptions),
    ...apiConsumes,
    ...apiParams,
    ...apiQueries,
    ...apiResponses,
    ApiResponse({
      description: "Request failed",
      content: {
        "application/problem+json": {
          schema: {
            $ref: getSchemaPath(ApiProblem),
          },
        },
      },
    }),
  );
};

type ApiPaginatedOperationOptions = Override<
  ApiOperationOptions,
  {
    responses?: Array<ApiResponseOptions & { model: Type }>;
  }
>;

export const ApiPaginatedOperation = (options: ApiPaginatedOperationOptions) => {
  const { responses, ...otherOptions } = options;
  const responseModels = responses?.map(({ model }) => model) ?? [];

  return applyDecorators(
    ApiExtraModels(PaginatedDto, ...responseModels),
    ApiOperation({
      ...otherOptions,
      queries: [
        // Necessary to properly send objects in query parameters
        {
          name: "pagination",
          style: "deepObject",
        },
        ...(options.queries ?? []),
      ],
      responses: responses?.map(({ model, ...response }) => ({
        ...response,
        schema: {
          allOf: [
            { $ref: getSchemaPath(PaginatedDto) },
            {
              properties: {
                data: {
                  type: "array",
                  items: { $ref: getSchemaPath(model) },
                },
              },
              required: ["data"],
            },
          ],
        },
      })),
    }),
  );
};
