import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../users/enums/user-role.enum.js';
import { UsersService } from '../../users/users.service.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  it('loads an existing user without returning the password hash', async () => {
    const strategy = new JwtStrategy(
      { get: () => 'test-secret' } as ConfigService,
      {
        findById: async () => ({
          id: 'user-1',
          email: 'user@example.com',
          passwordHash: 'sensitive-hash',
          role: UserRole.USER,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as UsersService,
    );

    await expect(strategy.validate({ sub: 'user-1', email: 'user@example.com', role: UserRole.USER })).resolves.toEqual({
      id: 'user-1',
      email: 'user@example.com',
      role: UserRole.USER,
    });
  });

  it('rejects a token for a missing user', async () => {
    const strategy = new JwtStrategy(
      { get: () => 'test-secret' } as ConfigService,
      { findById: async () => { throw new Error('not found'); } } as UsersService,
    );

    await expect(strategy.validate({ sub: 'missing', email: 'missing@example.com', role: UserRole.USER }))
      .rejects.toThrow(UnauthorizedException);
  });
});