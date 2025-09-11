import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {ProductPermission} from '../../../domain/auth';
import {ProductId} from '../../../domain/product/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    CreateProductDto,
    deleteProductSchema,
    getProductSchema,
    ListProductDto,
    ProductDto,
    UpdateProductInputDto,
    updateProductSchema,
} from '../dtos';
import {
    CreateProductService,
    DeleteProductService,
    GetProductService,
    ListProductService,
    UpdateProductService,
} from '../services';

@ApiTags('Product')
@Controller('product')
export class ProductController {
    constructor(
        private readonly createProductService: CreateProductService,
        private readonly listProductService: ListProductService,
        private readonly getProductService: GetProductService,
        private readonly updateProductService: UpdateProductService,
        private readonly deleteProductService: DeleteProductService
    ) {}

    @ApiOperation({
        summary: 'Creates a new product',
        responses: [
            {
                status: 201,
                description: 'Product created',
                type: ProductDto,
            },
        ],
    })
    @Authorize(ProductPermission.CREATE)
    @Post()
    async createProduct(@RequestActor() actor: Actor, @Body() payload: CreateProductDto): Promise<ProductDto> {
        return this.createProductService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a product',
        parameters: [entityIdParam('Product ID')],
        responses: [
            {
                status: 200,
                description: 'Product found',
                type: ProductDto,
            },
        ],
    })
    @Authorize(ProductPermission.VIEW)
    @Get(':id')
    async getProduct(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getProductSchema.shape.id) id: ProductId
    ): Promise<ProductDto> {
        return this.getProductService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Lists products',
        responses: [
            {
                status: 200,
                description: 'Products found',
                type: ProductDto,
            },
        ],
    })
    @Authorize(ProductPermission.VIEW)
    @Get()
    async listProduct(
        @RequestActor() actor: Actor,
        @Query() payload: ListProductDto
    ): Promise<PaginatedDto<ProductDto>> {
        return this.listProductService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates a product',
        parameters: [entityIdParam('Product ID')],
        responses: [
            {
                status: 200,
                description: 'Product updated',
                type: ProductDto,
            },
        ],
    })
    @Authorize(ProductPermission.UPDATE)
    @Put(':id')
    async updateProduct(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateProductSchema.shape.id) id: ProductId,
        @Body() payload: UpdateProductInputDto
    ): Promise<ProductDto> {
        return this.updateProductService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a product',
        parameters: [entityIdParam('Product ID')],
        responses: [
            {
                status: 200,
                description: 'Product deleted',
            },
        ],
    })
    @Authorize(ProductPermission.DELETE)
    @Delete(':id')
    async deleteProduct(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteProductSchema.shape.id) id: ProductId
    ): Promise<void> {
        await this.deleteProductService.execute({actor, payload: {id}});
    }
}
