import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity } from '../entities/event.entity.js';
import { EventStatus } from '../entities/event-status.enum.js';

export type EventPayload = Record<string, unknown>;

export type EventRecord = {
  id: string;
  type: string;
  payload: EventPayload;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class EventRepository {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
  ) {}

  async createEvent(
    eventData: Omit<EventRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: EventStatus;
    },
  ): Promise<EventRecord> {
    const event = this.eventsRepository.create({
      ...eventData,
      status: eventData.status ?? EventStatus.PENDING,
    });

    const savedEvent = await this.eventsRepository.save(event);

    return {
      id: savedEvent.id,
      type: savedEvent.type,
      payload: savedEvent.payload,
      status: savedEvent.status,
      createdAt: savedEvent.createdAt,
      updatedAt: savedEvent.updatedAt,
    };
  }

  async findAll(): Promise<EventRecord[]> {
    const events = await this.eventsRepository.find();

    return events.map((event) => ({
      id: event.id,
      type: event.type,
      payload: event.payload,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));
  }

  async findById(id: string): Promise<EventRecord | null> {
    const event = await this.eventsRepository.findOne({ where: { id } });

    if (!event) {
      return null;
    }

    return {
      id: event.id,
      type: event.type,
      payload: event.payload,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  async update(id: string, eventData: Partial<EventRecord>): Promise<EventRecord | null> {
    const existingEvent = await this.eventsRepository.findOne({ where: { id } });

    if (!existingEvent) {
      return null;
    }

    const mergedEvent = this.eventsRepository.merge(existingEvent, {
      ...eventData,
      payload: eventData.payload ?? existingEvent.payload,
      type: eventData.type ?? existingEvent.type,
      status: eventData.status ?? existingEvent.status,
    });

    const savedEvent = await this.eventsRepository.save(mergedEvent);

    return {
      id: savedEvent.id,
      type: savedEvent.type,
      payload: savedEvent.payload,
      status: savedEvent.status,
      createdAt: savedEvent.createdAt,
      updatedAt: savedEvent.updatedAt,
    };
  }

  async remove(id: string): Promise<void> {
    await this.eventsRepository.delete(id);
  }
}