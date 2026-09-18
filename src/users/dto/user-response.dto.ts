import { UserEntity } from '../entities/user.entity.js';

export type UserResponse = Pick<UserEntity, 'id' | 'email' | 'role' | 'createdAt' | 'updatedAt'>;

export function toUserResponse(user: UserEntity): UserResponse {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
