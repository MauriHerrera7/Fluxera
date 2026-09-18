import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { UserRole } from '../users/enums/user-role.enum.js';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { PasswordService } from '../users/password.service.js';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: async (email: string) => ({
      id: 'user-1',
      email,
      passwordHash: 'hashed-password',
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  const mockPasswordService = {
    comparePassword: async (password: string, hash: string) => password === 'StrongPass123!' && hash === 'hashed-password',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: JwtService, useValue: { sign: vi.fn().mockReturnValue('signed-token') } },
        { provide: ConfigService, useValue: { get: (key: string) => (key === 'app.jwtSecret' ? 'test-secret' : '1h') } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should validate a user with the correct password', async () => {
    const user = await service.validateUser('user@example.com', 'StrongPass123!');

    expect(user).toMatchObject({
      id: 'user-1',
      email: 'user@example.com',
      role: UserRole.USER,
    });
  });

  it('should reject invalid credentials', async () => {
    await expect(service.validateUser('user@example.com', 'WrongPassword!')).rejects.toThrow(UnauthorizedException);
  });
});
