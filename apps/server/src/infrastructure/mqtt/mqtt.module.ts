import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@infrastructure/config";
import { LoggerModule } from "@infrastructure/logger";
import { MqttClientService } from "@infrastructure/mqtt/mqtt-client.service";

@Global()
@Module({
  imports: [LoggerModule.register(), ConfigModule],
  providers: [MqttClientService],
  exports: [MqttClientService],
})
export class MqttModule {}
