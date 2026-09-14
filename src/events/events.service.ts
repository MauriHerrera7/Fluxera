import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dtos/create-event.dto.js';
import { EventRepository } from './repositories/event.repository.js';

@Injectable()
export class EventsService {
  constructor(private readonly eventRepository: EventRepository) {}

  create(dto: CreateEventDto) {
    return this.eventRepository.createEvent(dto);
  }

  findAll() {
    return this.eventRepository.findAll();
  }

  findById(id: string) {
    const event = this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return event;
  }

  remove(id: string): void {
    this.findById(id);
    this.eventRepository.remove(id);
  }
}
