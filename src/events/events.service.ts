import { Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus } from './entities/event-status.enum.js';
import { CreateEventDto } from './dtos/create-event.dto.js';
import { UpdateEventDto } from './dtos/update-event.dto.js';
import { EventRepository } from './repositories/event.repository.js';

type EventResponse = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
};

const toResponse = (event: {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}): EventResponse => ({
  id: event.id,
  type: event.type,
  data: event.payload,
  status: event.status,
  createdAt: event.createdAt,
  updatedAt: event.updatedAt,
});

@Injectable()
export class EventsService {
  constructor(private readonly eventRepository: EventRepository) {}

  async create(dto: CreateEventDto): Promise<EventResponse> {
    const event = await this.eventRepository.createEvent({
      type: dto.type,
      payload: dto.data,
      status: EventStatus.PENDING,
    });

    return toResponse(event);
  }

  async findAll(): Promise<EventResponse[]> {
    const events = await this.eventRepository.findAll();

    return events.map(toResponse);
  }

  async findById(id: string): Promise<EventResponse> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return toResponse(event);
  }

  async update(id: string, dto: UpdateEventDto): Promise<EventResponse> {
    await this.findById(id);

    const updatedEvent = await this.eventRepository.update(id, {
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.data !== undefined ? { payload: dto.data } : {}),
    });

    if (!updatedEvent) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return toResponse(updatedEvent);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.eventRepository.remove(id);
  }
}
