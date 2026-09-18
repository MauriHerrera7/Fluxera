import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { validate } from 'class-validator';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/auth-login.dto.js';
import { PasswordService } from '../users/password.service.js';
import { UserRole } from '../users/enums/user-role.enum.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email).catch(() => null);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async register(data: RegisterDto) {
    const dto = Object.assign(new RegisterDto(), data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      throw new BadRequestException('Invalid registration data');
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(normalizedEmail).catch(() => null);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    return this.usersService.create({
      email: normalizedEmail,
      passwordHash,
      role: UserRole.USER,
    });
  }

  async login(data: LoginDto) {
    const dto = Object.assign(new LoginDto(), data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      throw new BadRequestException('Invalid credentials');
    }

    const user = await this.usersService.findByEmail(dto.email.trim().toLowerCase()).catch(() => null);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.comparePassword(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwtSecret') ?? 'development-secret-key',
      expiresIn: (this.configService.get<string>('app.jwtExpiresIn') ?? '1h') as any,
    });

    return {
      accessToken,
      id: user.id,
      email: user.email,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
