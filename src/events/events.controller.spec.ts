import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';
import { EventRepository } from './repositories/event.repository.js';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  const mockRepository = {
    createEvent: async (eventData: { type: string; payload: Record<string, unknown>; status?: string }) => ({
      id: 'test-id',
      type: eventData.type,
      payload: eventData.payload,
      status: eventData.status ?? 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findAll: async () => [],
    findById: async (id: string) => {
      if (id === 'test-id') {
        return {
          id: 'test-id',
          type: 'invoice.created',
          payload: { invoiceId: 'abc-123' },
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return null;
    },
    update: async (id: string, eventData: { type?: string; payload?: Record<string, unknown>; status?: string }) => {
      if (id !== 'test-id') {
        return null;
      }

      return {
        id: 'test-id',
        type: eventData.type ?? 'invoice.created',
        payload: eventData.payload ?? { invoiceId: 'abc-123' },
        status: eventData.status ?? 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    remove: async () => undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        EventsService,
        {
          provide: EventRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  it('should create an event through the controller', async () => {
    const created = await controller.create({
      type: 'invoice.created',
      data: { invoiceId: 'abc-123' },
    });

    expect(created).toMatchObject({
      type: 'invoice.created',
      data: { invoiceId: 'abc-123' },
    });
    expect(created.id).toBeDefined();
  });

  it('should update an event through the controller', async () => {
    const event = await service.findById('test-id');

    const updated = await controller.update(event.id, {
      type: 'invoice.updated',
    });

    expect(updated).toMatchObject({
      id: event.id,
      type: 'invoice.updated',
      data: { invoiceId: 'abc-123' },
    });
  });

  it('should remove an existing event through the controller', async () => {
    const event = await service.findById('test-id');

    await expect(controller.remove(event.id)).resolves.toBeUndefined();
    await expect(service.findById('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
