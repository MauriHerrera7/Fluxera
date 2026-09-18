import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller.js';

@Module({
  imports: [TerminusModule, TypeOrmModule, BullModule.registerQueue({ name: 'events' })],
  controllers: [HealthController],
  providers: [],
})
export class HealthModule {}
