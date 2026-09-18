import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { UserRole } from '../users/enums/user-role.enum.js';
import { PasswordService } from '../users/password.service.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService login flow', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: async (email: string) => ({
      id: 'user-1',
      email,
      passwordHash: 'hashed:StrongPass123!',
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  const mockPasswordService = {
    comparePassword: async (password: string, hash: string) => password === 'StrongPass123!' && hash === 'hashed:StrongPass123!',
    hashPassword: async (password: string) => `hashed:${password}`,
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

  it('should login successfully with valid credentials', async () => {
    const result = await service.login({ email: 'user@example.com', password: 'StrongPass123!' });

    expect(result).toMatchObject({
      email: 'user@example.com',
      role: UserRole.USER,
    });
    expect(result.accessToken).toBeDefined();
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should reject invalid credentials', async () => {
    await expect(
      service.login({ email: 'user@example.com', password: 'WrongPassword!' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
