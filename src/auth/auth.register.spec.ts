import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { UserRole } from '../users/enums/user-role.enum.js';
import { PasswordService } from '../users/password.service.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService register flow', () => {
  let service: AuthService;

  const userStore = new Map<string, any>();

  const mockUsersService = {
    findByEmail: async (email: string) => userStore.get(email) ?? null,
    create: async (data: { email: string; passwordHash: string; role?: UserRole }) => {
      const created = {
        id: `user-${userStore.size + 1}`,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role ?? UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userStore.set(data.email, created);
      return created;
    },
  };

  const mockPasswordService = {
    hashPassword: async (password: string) => `hashed:${password}`,
    comparePassword: async (password: string, hash: string) => password === 'StrongPass123!' && hash === 'hashed:StrongPass123!',
  };

  beforeEach(async () => {
    userStore.clear();

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

  it('should register a user successfully', async () => {
    const created = await service.register({
      email: 'new@example.com',
      password: 'StrongPass123!',
    });

    expect(created).toMatchObject({
      email: 'new@example.com',
      role: UserRole.USER,
    });
    expect(created).not.toHaveProperty('password');
    expect(created).not.toHaveProperty('passwordHash');
  });

  it('should reject a duplicate email', async () => {
    await service.register({
      email: 'duplicate@example.com',
      password: 'StrongPass123!',
    });

    await expect(
      service.register({
        email: 'duplicate@example.com',
        password: 'AnotherPass123!',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should reject invalid registration data', async () => {
    await expect(
      service.register({
        email: 'invalid-email',
        password: 'short',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should ignore admin role attempts from public registration', async () => {
    const created = await service.register({
      email: 'admin-attempt@example.com',
      password: 'StrongPass123!',
      role: UserRole.ADMIN,
    } as any);

    expect(created.role).toBe(UserRole.USER);
  });
});
