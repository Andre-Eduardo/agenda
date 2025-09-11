import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Blockade} from '../entities';

export class BlockadeStartedEvent extends CompanyDomainEvent {
    static readonly type = 'BLOCKADE_STARTED';
    readonly blockade: Blockade;

    constructor(props: DomainEventProps<BlockadeStartedEvent>) {
        super(BlockadeStartedEvent.type, props);
        this.blockade = props.blockade;
    }
}
