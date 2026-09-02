import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dtos/create-event.dto.js';

@Injectable()
export class EventsService {
    
    create(dto: CreateEventDto)
    {
        return dto;
    }
    

}
