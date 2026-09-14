import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service.js';
import { EventRepository } from './repositories/event.repository.js';

describe('EventsService', () => {
  let service: EventsService;

  const mockRepository = {
    createEvent: async (eventData: { type: string; payload: Record<string, unknown>; status?: string }) => ({
      id: 'generated-id',
      type: eventData.type,
      payload: eventData.payload,
      status: eventData.status ?? 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findAll: async () => [
      {
        id: 'generated-id',
        type: 'user.created',
        payload: { userId: '123' },
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    findById: async (id: string) => {
      if (id === 'generated-id') {
        return {
          id: 'generated-id',
          type: 'user.created',
          payload: { userId: '123' },
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return null;
    },
    update: async (id: string, eventData: { type?: string; payload?: Record<string, unknown>; status?: string }) => {
      if (id !== 'generated-id') {
        return null;
      }

      return {
        id: 'generated-id',
        type: eventData.type ?? 'user.created',
        payload: eventData.payload ?? { userId: '123' },
        status: eventData.status ?? 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    remove: async () => undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: EventRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should create an event', async () => {
    const event = await service.create({
      type: 'user.created',
      data: { userId: '123' },
    });

    expect(event).toMatchObject({
      type: 'user.created',
      data: { userId: '123' },
    });
    expect(event.id).toBeDefined();
  });

  it('should return all events', async () => {
    const events = await service.findAll();

    expect(events).toHaveLength(1);
  });

  it('should return an existing event by id', async () => {
    const event = await service.findById('generated-id');

    expect(event).toMatchObject({
      id: 'generated-id',
      type: 'user.created',
      data: { userId: '123' },
    });
  });

  it('should throw when finding a missing event by id', async () => {
    await expect(service.findById('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('should update only the fields sent in a partial update', async () => {
    const updated = await service.update('generated-id', {
      type: 'payment.updated',
    });

    expect(updated).toMatchObject({
      id: 'generated-id',
      type: 'payment.updated',
      data: { userId: '123' },
    });
  });

  it('should throw when updating a missing event', async () => {
    await expect(
      service.update('missing-id', { type: 'payment.updated' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should remove an existing event', async () => {
    await expect(service.remove('generated-id')).resolves.toBeUndefined();
  });

  it('should throw when removing a missing event', async () => {
    await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
  });
});
