import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {InvalidInputException} from '../../@shared/exceptions';
import type {DefectId} from '../../defect/entities';
import {RoomStatus, RoomStatusId} from '../../room-status/entities';
import type {UserId} from '../../user/entities';
import {MaintenanceChangedEvent, MaintenanceCreatedEvent, MaintenanceFinishedEvent} from '../events';

export type MaintenanceProps = EntityProps<Maintenance>;
export type CreateMaintenance = Omit<CreateEntity<Maintenance>, 'startedAt'>;
export type UpdateMaintenance = Partial<MaintenanceProps>;

export class Maintenance extends RoomStatus {
    note: string;
    defects: DefectId[];

    constructor(props: AllEntityProps<Maintenance>) {
        super(props);
        this.note = props.note;
        this.defects = props.defects;
        this.validate();
    }

    static create(props: CreateMaintenance): Maintenance {
        const now = new Date();

        const maintenance = new Maintenance({
            ...props,
            id: RoomStatusId.generate(),
            finishedAt: null,
            finishedById: null,
            startedAt: now,
            createdAt: now,
            updatedAt: now,
        });

        maintenance.addEvent(new MaintenanceCreatedEvent({companyId: props.companyId, maintenance, timestamp: now}));

        return maintenance;
    }

    change(props: UpdateMaintenance): void {
        const oldMaintenance = new Maintenance(this);

        if (props.note !== undefined) {
            this.note = props.note;
            this.validate('note');
        }

        if (props.defects !== undefined) {
            this.defects = props.defects;
            this.validate('defects');
        }

        this.addEvent(
            new MaintenanceChangedEvent({
                companyId: this.companyId,
                oldState: oldMaintenance,
                newState: this,
            })
        );
    }

    finish(finishedById: UserId): void {
        const now = new Date();

        this.finishedById = finishedById;
        this.finishedAt = now;

        this.addEvent(
            new MaintenanceFinishedEvent({
                companyId: this.companyId,
                maintenanceId: this.id,
                finishedById,
                timestamp: now,
            })
        );
    }

    toJSON(): EntityJson<Maintenance> {
        return {
            ...super.toJSON(),
            note: this.note,
            defects: this.defects.map((defectId) => defectId.toJSON()),
        };
    }

    private validate(...fields: Array<keyof MaintenanceProps>): void {
        if (fields.length === 0 || fields.includes('note')) {
            if (this.note.length < 1) {
                throw new InvalidInputException('Maintenance note must be at least 1 character long.');
            }
        }

        if (fields.length === 0 || fields.includes('defects')) {
            if (this.defects.length < 1) {
                throw new InvalidInputException('Maintenance defects must be at least 1 defect.');
            }
        }
    }
}
