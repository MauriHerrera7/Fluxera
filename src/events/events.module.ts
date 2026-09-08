import { Module } from '@nestjs/common';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';
import { EventRepository } from './repositories/event.repository.js';

@Module({
  controllers: [EventsController],
  providers: [EventsService, EventRepository],
})
export class EventsModule {}
