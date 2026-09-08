import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dtos/create-event.dto.js';
import { EventRepository } from './repositories/event.repository.js';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class EventsService {
    constructor(private eventRepository: EventRepository) {}
    
    create(dto: CreateEventDto)
    {
        const event = this.eventRepository.createEvent(dto);

        return event;
    }
    findAll()
    {
        return this.eventRepository.findAll();
    }
    
    findById(id: string)
    {
        const event = this.eventRepository.findById(id);
        if (!event) {
    throw new NotFoundException(`Event with id ${id} not found`);}
        return event;
    }
    
}
