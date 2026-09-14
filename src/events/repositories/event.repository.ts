import { randomUUID } from 'crypto';

type EventRecord = {
  id: string;
  type: string;
  data: Record<string, unknown>;
};

export class EventRepository {
  private readonly events: EventRecord[] = [];

  createEvent(eventData: Omit<EventRecord, 'id'>): EventRecord {
    const event: EventRecord = {
      id: randomUUID(),
      ...eventData,
    };

    this.events.push(event);
    return event;
  }

  findAll(): EventRecord[] {
    return this.events;
  }

  findById(id: string): EventRecord | undefined {
    return this.events.find((event) => event.id === id);
  }

  remove(id: string): void {
    const eventIndex = this.events.findIndex((event) => event.id === id);

    if (eventIndex === -1) {
      return;
    }

    this.events.splice(eventIndex, 1);
  }
}