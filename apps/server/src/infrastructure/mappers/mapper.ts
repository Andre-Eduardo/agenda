import type { PaginatedDto } from '../../application/@shared/dto';
import type { PaginatedList } from '../../domain/@shared/repository';

abstract class BaseMapper<E, ReadModel, WriteModel = ReadModel> {
    toDomainList(models: ReadModel[]): E[] {
        return models.map((model) => this.toDomain(model));
    }

    abstract toDomain(model: ReadModel): E;

    abstract toPersistence(entity: E): WriteModel;
}

export abstract class MapperWithDto<E, ReadModel, D, WriteModel = ReadModel> extends BaseMapper<E, ReadModel, WriteModel> {
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

export abstract class MapperWithoutDto<E, ReadModel, WriteModel = ReadModel> extends BaseMapper<E, ReadModel, WriteModel> { }
