import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    validateUser: async (email: string, password: string) => ({
      id: 'user-1',
      email,
      role: 'USER',
      passwordHash: undefined,
      password,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should delegate validation to the auth service', async () => {
    const result = await controller.validateUser({
      email: 'user@example.com',
      password: 'StrongPass123!',
    });

    expect(result).toMatchObject({
      email: 'user@example.com',
      role: 'USER',
    });
  });
});
