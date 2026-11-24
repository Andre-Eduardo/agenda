import {Module} from '@nestjs/common';
import {EventEmitterModule} from '@nestjs/event-emitter';
import {EventDispatcher} from '@domain/event';
import {EventEmitterDispatcher} from '@infrastructure/event/event-emitter.dispatcher';
import {RepositoryModule} from '@infrastructure/repository';

@Module({
    imports: [EventEmitterModule.forRoot({wildcard: true}), RepositoryModule],
    providers: [
        {
            provide: EventDispatcher,
            useClass: EventEmitterDispatcher,
        },
    ],
    exports: [EventDispatcher],
})
export class EventModule {}
