import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { CreateEventDto } from './dtos/create-event.dto.js';

@Controller('events')
export class EventsController {
   constructor(private readonly eventsService: EventsService) {}

     @Post()
     create(@Body() dto: CreateEventDto) {
        return this.eventsService.create(dto);
     }
     @Get()
     findAll() {
        return this.eventsService.findAll();
     }
     @Get(':id')
     getById(@Param('id') id: string) {
         return this.eventsService.findById(id);
     }
      

     
}
