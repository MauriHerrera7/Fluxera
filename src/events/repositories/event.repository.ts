import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { EventIdempotencyKeyEntity } from '../entities/event-idempotency-key.entity.js';
import { EventStatus } from '../enums/event-status.enum.js';
import { EventEntity } from '../entities/event.entity.js';

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
    @InjectRepository(EventIdempotencyKeyEntity)
    private readonly eventIdempotencyRepository: Repository<EventIdempotencyKeyEntity>,
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
    return this.toRecord(savedEvent);
  }

  async createEventWithIdempotency(
    eventData: Omit<EventRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: EventStatus;
    },
    idempotencyKey: string,
  ): Promise<{ event: EventRecord; created: boolean }> {
    const normalizedKey = idempotencyKey.trim();

    const existingKey = await this.eventIdempotencyRepository.findOne({
      where: { key: normalizedKey },
      relations: { event: true },
    });

    if (existingKey?.event) {
      return { event: this.toRecord(existingKey.event), created: false };
    }

    const queryRunner = this.eventsRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const keyInTx = await queryRunner.manager
        .getRepository(EventIdempotencyKeyEntity)
        .findOne({ where: { key: normalizedKey }, relations: { event: true } });

      if (keyInTx?.event) {
        await queryRunner.rollbackTransaction();
        return { event: this.toRecord(keyInTx.event), created: false };
      }

      const createdEvent = queryRunner.manager.getRepository(EventEntity).create({
        type: eventData.type,
        payload: eventData.payload,
        status: eventData.status ?? EventStatus.PENDING,
      });

      const savedEvent = await queryRunner.manager.getRepository(EventEntity).save(createdEvent);

      const nextKey = queryRunner.manager.getRepository(EventIdempotencyKeyEntity).create({
        key: normalizedKey,
        event: savedEvent,
        eventId: savedEvent.id,
      });

      await queryRunner.manager.getRepository(EventIdempotencyKeyEntity).save(nextKey);
      await queryRunner.commitTransaction();

      return { event: this.toRecord(savedEvent), created: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof QueryFailedError &&
        typeof error.message === 'string' &&
        error.message.toLowerCase().includes('duplicate key')
      ) {
        const retryKey = await this.eventIdempotencyRepository.findOne({
          where: { key: normalizedKey },
          relations: { event: true },
        });

        if (retryKey?.event) {
          return { event: this.toRecord(retryKey.event), created: false };
        }
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<EventRecord[]> {
    const events = await this.eventsRepository.find();
    return events.map((event) => this.toRecord(event));
  }

  async findById(id: string): Promise<EventRecord | null> {
    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) {
      return null;
    }

    return this.toRecord(event);
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
    return this.toRecord(savedEvent);
  }

  async updateStatus(id: string, status: EventStatus): Promise<EventRecord | null> {
    const existingEvent = await this.eventsRepository.findOne({ where: { id } });

    if (!existingEvent) {
      return null;
    }

    const savedEvent = await this.eventsRepository.save({
      ...existingEvent,
      status,
    });

    return this.toRecord(savedEvent);
  }

  async remove(id: string): Promise<void> {
    await this.eventsRepository.delete(id);
  }

  private toRecord(event: EventEntity): EventRecord {
    return {
      id: event.id,
      type: event.type,
      payload: event.payload,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}