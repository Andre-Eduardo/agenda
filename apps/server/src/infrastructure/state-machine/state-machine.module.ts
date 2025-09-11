import {Module} from '@nestjs/common';
import {Logger} from '../../application/@shared/logger';
import {RoomMachineFactory} from '../../domain/room/state-machine';
import {LoggerModule} from '../logger';
import {XStateRoomMachineFactory} from './xstate';

@Module({
    imports: [LoggerModule.register()],
    providers: [
        {
            provide: RoomMachineFactory,
            useFactory: (logger: Logger) => new XStateRoomMachineFactory(logger, undefined),
            inject: [Logger],
        },
    ],
    exports: [RoomMachineFactory],
})
export class StateMachineModule {}
