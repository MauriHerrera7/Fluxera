import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateEventDto {
    @ApiProperty({
        description: 'Tipo de evento utilizado por el procesador y los consumidores.',
        example: 'order.created',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    type: string;

    @ApiProperty({
        description: 'Datos del negocio que contiene el evento para su procesamiento.',
        example: { orderId: '12345', customerId: '67890' },
        type: 'object',
        additionalProperties: true,
    })
    @IsObject()
    data: Record<string, unknown>;
}