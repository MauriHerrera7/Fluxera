import {randomUUID} from 'crypto';

export class EventRepository {
    private events = [];

  createEvent(eventData){
    const event = {
      id: randomUUID(),
      ...eventData
    };
    this.events.push(event);
     return event;
  }
   findAll(){
    return this.events;
  }
  findById(id){
    return this.events.find(event => event.id === id);
  }
}