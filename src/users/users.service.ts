import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from './enums/user-role.enum.js';
import { UserEntity } from './entities/user.entity.js';
import { UserRepository } from './repositories/user.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(data: { email: string; passwordHash: string; role?: UserRole }): Promise<UserEntity> {
    const normalizedEmail = data.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    return this.userRepository.create({
      email: normalizedEmail,
      passwordHash: data.passwordHash,
      role: data.role ?? UserRole.USER,
    });
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const user = await this.userRepository.findByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
