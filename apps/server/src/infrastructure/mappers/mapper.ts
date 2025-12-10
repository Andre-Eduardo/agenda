import type {PaginatedDto} from '../../application/@shared/dto';
import type {PaginatedList} from '../../domain/@shared/repository';

abstract class BaseMapper<E, M> {
    toDomainList(models: M[]): E[] {
        return models.map((model) => this.toDomain(model));
    }

    abstract toDomain(model: M): E;

    abstract toPersistence(entity: E): M;
}

export abstract class MapperWithDto<E, M, D> extends BaseMapper<E, M> {
    toDtoList(entities: E[]): D[] {
        return entities.map((entity) => this.toDto(entity));
    }

    toPaginatedDto(paginatedList: PaginatedList<E>): PaginatedDto<D> {
        return {
            ...paginatedList,
            data: this.toDtoList(paginatedList.data),
        };
    }

    abstract toDto(entity: E, ...args: never[]): D;
}

export abstract class MapperWithoutDto<E, M> extends BaseMapper<E, M> {}
