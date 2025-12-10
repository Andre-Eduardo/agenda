import {PaginatedList} from '../../domain/@shared/repository/pagination';
import {PaginatedDto} from '../../application/@shared/dto/paginated.dto';

export abstract class BaseMapper<M, E> {
    abstract toDomain(model: M): E;
    abstract toPersistence(entity: E): M;

    toDomainList(models: M[]): E[] {
        return models.map((model) => this.toDomain(model));
    }
}

export abstract class MapperWithDto<M, E, D> extends BaseMapper<M, E> {
    abstract toDto(entity: E, ...args: never[]): D;

    toDtoList(entities: E[]): D[] {
        return entities.map((entity) => this.toDto(entity));
    }

    toPaginatedDto(paginatedList: PaginatedList<E>): PaginatedDto<D> {
        return {
            ...paginatedList,
            data: this.toDtoList(paginatedList.data),
        };
    }
}

export abstract class MapperWithoutDto<M, E> extends BaseMapper<M, E> {}
