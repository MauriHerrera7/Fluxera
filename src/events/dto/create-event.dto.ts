import { IsNotEmpty, IsObject, IsString } from "class-validator";

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    type: string;
    
    @IsObject() 
    data: Record<string, unknown>;
}