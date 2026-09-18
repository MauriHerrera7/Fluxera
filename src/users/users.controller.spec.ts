import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from './enums/user-role.enum.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

describe('UsersController', () => {
  let controller: UsersController;

  const mockService = {
    create: async (dto: { email: string; passwordHash: string }) => ({
      id: 'user-1',
      email: dto.email,
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findById: async (id: string) => ({
      id,
      email: 'user@example.com',
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findByEmail: async (email: string) => ({
      id: 'user-1',
      email,
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should create a user through the controller', async () => {
    const created = await controller.create({
      email: 'new@example.com',
      passwordHash: 'hashed-password',
    });

    expect(created).toMatchObject({
      email: 'new@example.com',
      role: UserRole.USER,
    });
  });

  it('should get a user by id from the controller', async () => {
    const user = await controller.getById('user-1');

    expect(user).toMatchObject({
      id: 'user-1',
      email: 'user@example.com',
    });
  });
});
