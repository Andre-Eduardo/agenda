import {Global, Module} from '@nestjs/common';
import {ConfigModule} from '../config';
import {LoggerModule} from '../logger';
import {MqttClientService} from './mqtt-client.service';

@Global()
@Module({
    imports: [LoggerModule.register(), ConfigModule],
    providers: [MqttClientService],
    exports: [MqttClientService],
})
export class MqttModule {}
