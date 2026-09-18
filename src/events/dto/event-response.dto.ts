import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../enums/event-status.enum.js';

export class EventResponseDto {
  @ApiProperty({ format: 'uuid', example: '8d7d8b3e-7a3d-4e41-9b4f-4b6c9c7b4e2a' })
  id: string;

  @ApiProperty({ example: 'order.created' })
  type: string;

  @ApiProperty({
    description: 'Datos del evento devueltos en la propiedad data.',
    example: { orderId: '12345', customerId: '67890' },
    type: 'object',
    additionalProperties: true,
  })
  data: Record<string, unknown>;

  @ApiProperty({ enum: EventStatus, enumName: 'EventStatus', example: EventStatus.PENDING })
  status: EventStatus;

  @ApiProperty({ format: 'date-time', example: '2026-09-17T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time', example: '2026-09-17T12:00:00.000Z' })
  updatedAt: Date;
}