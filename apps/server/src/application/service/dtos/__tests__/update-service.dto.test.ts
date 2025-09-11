import {ServiceCategoryId} from '../../../../domain/service-category/entities';
import {UpdateServiceInputDto} from '../update-service.dto';

describe('A UpdateServiceInputDto', () => {
    it.each([
        {
            name: 'Name 1',
            code: 1,
            price: 100,
        },
        {
            name: 'Name 2',
            categoryId: ServiceCategoryId.generate().toString(),
            code: 15,
            price: 250,
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateServiceInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });
});
