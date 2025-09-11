import type {Sale, SaleId} from './entities';

export interface SaleRepository {
    findById(id: SaleId): Promise<Sale | null>;
}

export abstract class SaleRepository {}
