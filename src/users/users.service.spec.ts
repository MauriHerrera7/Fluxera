import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from './enums/user-role.enum.js';
import { UserRepository } from './repositories/user.repository.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;

  const mockRepository = {
    findByEmail: async (email: string) => (email === 'existing@example.com' ? { id: 'user-1', email, role: UserRole.USER } : null),
    findById: async (id: string) => (id === 'user-1' ? { id, email: 'user@example.com', role: UserRole.USER } : null),
    create: async (data: { email: string; passwordHash: string; role?: UserRole }) => ({
      id: 'user-2',
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role ?? UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should create a user with the default role', async () => {
    const created = await service.create({
      email: 'new@example.com',
      passwordHash: 'hashed-password',
    });

    expect(created).toMatchObject({
      email: 'new@example.com',
      role: UserRole.USER,
    });
  });

  it('should throw when the email already exists', async () => {
    await expect(
      service.create({
        email: 'existing@example.com',
        passwordHash: 'hashed-password',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should find a user by email', async () => {
    const user = await service.findByEmail('existing@example.com');

    expect(user).toMatchObject({
      id: 'user-1',
      email: 'existing@example.com',
      role: UserRole.USER,
    });
  });

  it('should find a user by id', async () => {
    const user = await service.findById('user-1');

    expect(user).toMatchObject({
      id: 'user-1',
      email: 'user@example.com',
      role: UserRole.USER,
    });
  });

  it('should throw when a user is missing by id', async () => {
    await expect(service.findById('missing-id')).rejects.toThrow(NotFoundException);
  });
});
