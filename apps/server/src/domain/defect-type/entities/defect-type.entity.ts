import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import {DefectTypeChangedEvent, DefectTypeCreatedEvent, DefectTypeDeletedEvent} from '../events';

export type DefectTypeProps = EntityProps<DefectType>;
export type CreateDefectType = CreateEntity<DefectType>;
export type UpdateDefectType = Omit<Partial<DefectTypeProps>, 'companyId'>;

export class DefectType extends AggregateRoot<DefectTypeId> {
    companyId: CompanyId;
    name: string;

    constructor(props: AllEntityProps<DefectType>) {
        super(props);
        this.companyId = props.companyId;
        this.name = props.name;
        this.validate();
    }

    static create(props: CreateDefectType): DefectType {
        const defectTypeId = DefectTypeId.generate();
        const now = new Date();

        const defectType = new DefectType({
            ...props,
            id: defectTypeId,
            createdAt: now,
            updatedAt: now,
        });

        defectType.addEvent(
            new DefectTypeCreatedEvent({
                companyId: props.companyId,
                defectType,
                timestamp: now,
            })
        );

        return defectType;
    }

    change(props: UpdateDefectType): void {
        const oldDefectType = new DefectType(this);

        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        this.addEvent(
            new DefectTypeChangedEvent({
                companyId: this.companyId,
                oldState: oldDefectType,
                newState: this,
            })
        );
    }

    delete(): void {
        this.addEvent(new DefectTypeDeletedEvent({companyId: this.companyId, defectType: this}));
    }

    toJSON(): EntityJson<DefectType> {
        return {
            id: this.id.toString(),
            companyId: this.companyId.toJSON(),
            name: this.name,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof DefectTypeProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (this.name.length < 1) {
                throw new InvalidInputException('Defect type name must be at least 1 character long.');
            }
        }
    }
}

export class DefectTypeId extends EntityId<'DefectTypeId'> {
    static from(value: string): DefectTypeId {
        return new DefectTypeId(value);
    }

    static generate(): DefectTypeId {
        return new DefectTypeId();
    }
}
