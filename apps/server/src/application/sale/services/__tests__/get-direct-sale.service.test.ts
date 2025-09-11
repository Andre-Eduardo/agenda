import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {DirectSaleRepository} from '../../../../domain/sale/direct-sale.repository';
import {SaleId} from '../../../../domain/sale/entities';
import {fakeDirectSale} from '../../../../domain/sale/entities/__tests__/fake-direct-sale';
import {UserId} from '../../../../domain/user/entities';
import type {GetDirectSaleDto} from '../../dtos';
import {DirectSaleDto} from '../../dtos';
import {GetDirectSaleService} from '../get-direct-sale.service';

describe('A get-direct-sale service', () => {
    const directSaleRepository = mock<DirectSaleRepository>();
    const getDirectSaleService = new GetDirectSaleService(directSaleRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a direct sale', async () => {
        const existingDirectSale = fakeDirectSale();

        const payload: GetDirectSaleDto = {
            id: existingDirectSale.id,
        };

        jest.spyOn(directSaleRepository, 'findById').mockResolvedValueOnce(existingDirectSale);

        await expect(getDirectSaleService.execute({actor, payload})).resolves.toEqual(
            new DirectSaleDto(existingDirectSale)
        );

        expect(existingDirectSale.events).toHaveLength(0);

        expect(directSaleRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the direct sale does not exist', async () => {
        const payload: GetDirectSaleDto = {
            id: SaleId.generate(),
        };

        jest.spyOn(directSaleRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getDirectSaleService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Direct sale not found'
        );
    });
});
