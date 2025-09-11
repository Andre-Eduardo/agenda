import {PersonId} from '../../../person/entities';
import {DirectSale} from '../index';
import {fakeSale} from './fake-sale';

export function fakeDirectSale(payload: Partial<DirectSale> = {}): DirectSale {
    return new DirectSale({
        buyerId: PersonId.generate(),
        ...payload,
        ...fakeSale(payload),
    });
}
