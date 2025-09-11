import {ServiceCategoryId} from '../../../../domain/service-category/entities';
import {UpdateServiceCategoryInputDto} from '../update-service-category.dto';

describe('A UpdateServiceCategoryInputDto', () => {
    it.each([
        {
            id: ServiceCategoryId.generate().toString(),
            name: 'Technical support',
        },
        {
            id: ServiceCategoryId.generate().toString(),
            name: 'Cleaning',
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateServiceCategoryInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });
});
