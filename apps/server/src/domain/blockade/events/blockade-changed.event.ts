import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Blockade} from '../entities';

export class BlockadeChangedEvent extends CompanyDomainEvent {
    static readonly type = 'BLOCKADE_CHANGED';
    readonly oldState: Blockade;
    readonly newState: Blockade;

    constructor(props: DomainEventProps<BlockadeChangedEvent>) {
        super(BlockadeChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
