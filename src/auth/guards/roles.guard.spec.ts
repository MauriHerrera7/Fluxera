import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators/roles.decorator.js';
import { RolesGuard } from './roles.guard.js';
import { UserRole } from '../../users/enums/user-role.enum.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let handler: any;
  let context: any;

  beforeEach(() => {
    guard = new RolesGuard(new Reflector());
    handler = function handler() {
      return true;
    };
    context = {
      getHandler: () => handler,
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => ({ user: undefined }),
      }),
    };
  });

  it('allows access when no roles are declared', () => {
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when the authenticated user has the required role', () => {
    Reflect.defineMetadata('roles', [UserRole.ADMIN], handler);
    context.switchToHttp = () => ({
      getRequest: () => ({ user: { role: UserRole.ADMIN } }),
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when the authenticated user does not have the required role', () => {
    Reflect.defineMetadata('roles', [UserRole.ADMIN], handler);
    context.switchToHttp = () => ({
      getRequest: () => ({ user: { role: UserRole.USER } }),
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when the request has no authenticated user', () => {
    Reflect.defineMetadata('roles', [UserRole.ADMIN], handler);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('supports the @Roles decorator metadata', () => {
    Roles(UserRole.ADMIN)(handler);

    expect(Reflect.getMetadata('roles', handler)).toEqual([UserRole.ADMIN]);
  });
});
