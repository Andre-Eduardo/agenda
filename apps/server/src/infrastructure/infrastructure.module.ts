import { Module } from "@nestjs/common";
import { ClsModule } from "nestjs-cls";
import { AuthModule } from "@infrastructure/auth/auth.module";
import { ConfigModule } from "@infrastructure/config";
import { EventModule } from "@infrastructure/event";
import { LoggerModule } from "@infrastructure/logger";
import { RepositoryModule } from "@infrastructure/repository";
import { StorageModule } from "@infrastructure/storage/storage.module";
import { AiProviderModule } from "@infrastructure/ai-provider/ai-provider.module";

const sharedModules = [
  ClsModule.forRoot({ global: true }),
  AuthModule,
  ConfigModule,
  EventModule,
  LoggerModule.register(),
  RepositoryModule,
  StorageModule,
  AiProviderModule,
];

@Module({
  imports: sharedModules,
  exports: sharedModules,
})
export class InfrastructureModule {}
