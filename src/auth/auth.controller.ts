import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/auth-login.dto.js';
import { AuthService } from './auth.service.js';

export class ValidateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validar credenciales' })
  @ApiBody({ type: ValidateUserDto })
  async validateUser(@Body() dto: ValidateUserDto) {
    return this.authService.validateUser(dto.email, dto.password);
  }

  @Post('register')
  @ApiOperation({ summary: 'Registrar un usuario' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuario registrado sin exponer su password ni passwordHash.' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Token JWT y datos públicos del usuario.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
