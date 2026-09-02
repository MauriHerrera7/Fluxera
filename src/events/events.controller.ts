import { Body, Controller, Post } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { CreateEventDto } from './dtos/create-event.dto.js';

@Controller('events')
export class EventsController {
   constructor(private readonly eventsService: EventsService) {}

     @Post()
     create(@Body() dto: CreateEventDto) {
        return this.eventsService.create(dto);
     }
     
      

     
}
