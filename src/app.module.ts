import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { appConfig, databaseConfig, redisConfig } from './config/app.config.js';
import { envValidationSchema } from './config/env.validation.js';
import { AuthModule } from './auth/auth.module.js';
import { EventIdempotencyKeyEntity } from './events/entities/event-idempotency-key.entity.js';
import { EventEntity } from './events/entities/event.entity.js';
import { EventsModule } from './events/events.module.js';
import { HealthModule } from './health/health.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig],
      validationSchema: envValidationSchema,
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('database.host') ?? 'localhost';

        return {
          type: 'postgres' as const,
          host,
          port: configService.get<number>('database.port') ?? 5432,
          username: configService.get<string>('database.username') ?? 'postgres',
          password: configService.get<string>('database.password') ?? 'postgres',
          database: configService.get<string>('database.database') ?? 'fluxera',
          entities: [EventEntity, EventIdempotencyKeyEntity],
          synchronize: false,
          migrations: ['dist/database/migrations/*.js'],
          migrationsRun: false,
          logging: configService.get<string>('app.nodeEnv') === 'development',
        };
      },
    }),
    EventsModule,
    HealthModule,
    UsersModule,
    AuthModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
