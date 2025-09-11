import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {ProductCategoryPermission} from '../../../domain/auth';
import {ProductCategoryId} from '../../../domain/product-category/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    CreateProductCategoryDto,
    deleteProductCategorySchema,
    getProductCategorySchema,
    ProductCategoryDto,
    UpdateProductCategoryInputDto,
    updateProductCategorySchema,
    ListProductCategoryDto,
} from '../dtos';
import {
    CreateProductCategoryService,
    DeleteProductCategoryService,
    GetProductCategoryService,
    ListProductCategoryService,
    UpdateProductCategoryService,
} from '../services';

@ApiTags('Product category')
@Controller('product-category')
export class ProductCategoryController {
    constructor(
        private readonly createProductCategoryService: CreateProductCategoryService,
        private readonly listProductCategoryService: ListProductCategoryService,
        private readonly getProductCategoryService: GetProductCategoryService,
        private readonly updateProductCategoryService: UpdateProductCategoryService,
        private readonly deleteProductCategoryService: DeleteProductCategoryService
    ) {}

    @ApiOperation({
        summary: 'Creates a new product category',
        responses: [
            {
                status: 201,
                description: 'Product category created',
                type: ProductCategoryDto,
            },
        ],
    })
    @Authorize(ProductCategoryPermission.CREATE)
    @Post()
    async createProductCategory(
        @RequestActor() actor: Actor,
        @Body() payload: CreateProductCategoryDto
    ): Promise<ProductCategoryDto> {
        return this.createProductCategoryService.execute({actor, payload});
    }

    @ApiPaginatedOperation({
        summary: 'Finds a product category',
        responses: [
            {
                status: 200,
                description: 'Product category found',
                model: ProductCategoryDto,
            },
        ],
    })
    @Authorize(ProductCategoryPermission.VIEW)
    @Get()
    async listProductCategory(
        @RequestActor() actor: Actor,
        @Query() payload: ListProductCategoryDto
    ): Promise<PaginatedDto<ProductCategoryDto>> {
        return this.listProductCategoryService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a product category',
        parameters: [entityIdParam('Product category ID')],
        responses: [
            {
                status: 200,
                description: 'Product category found',
                type: ProductCategoryDto,
            },
        ],
    })
    @Authorize(ProductCategoryPermission.VIEW)
    @Get(':id')
    async getProductCategory(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getProductCategorySchema.shape.id) id: ProductCategoryId
    ): Promise<ProductCategoryDto> {
        return this.getProductCategoryService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Updates a product category',
        parameters: [entityIdParam('Product category ID')],
        responses: [
            {
                status: 200,
                description: 'Product category updated',
            },
        ],
    })
    @Authorize(ProductCategoryPermission.UPDATE)
    @Put(':id')
    async updateProductCategory(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateProductCategorySchema.shape.id) id: ProductCategoryId,
        @Body() payload: UpdateProductCategoryInputDto
    ): Promise<ProductCategoryDto> {
        return this.updateProductCategoryService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a product category',
        parameters: [entityIdParam('Product category ID')],
        responses: [
            {
                status: 200,
                description: 'Product category deleted',
            },
        ],
    })
    @Authorize(ProductCategoryPermission.DELETE)
    @Delete(':id')
    async deleteProductCategory(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteProductCategorySchema.shape.id) id: ProductCategoryId
    ): Promise<void> {
        await this.deleteProductCategoryService.execute({actor, payload: {id}});
    }
}
