import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) { }

  async create(tenantId: string, createUserDto: CreateUserDto) {
    // Check if user with email already exists in this tenant
    const existingUser = await this.repository.findByEmail(tenantId, createUserDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Derive firstName/lastName from name when provided
    const firstName = createUserDto.firstName || (createUserDto.name ? createUserDto.name.split(' ')[0] : undefined);
    const lastName = createUserDto.lastName || (createUserDto.name ? createUserDto.name.split(' ').slice(1).join(' ') : undefined);

    // Create user
    const user = await this.repository.create(tenantId, {
      email: createUserDto.email,
      password: hashedPassword,
      role: createUserDto.role || 'CLIENT',
      isActive: createUserDto.isActive !== undefined ? createUserDto.isActive : true,
      firstName: firstName || null,
      lastName: lastName || null,
    });

    return this.sanitizeUser(user);
  }

  async findAll(tenantId: string, query: QueryUsersDto) {
    const [users, total] = await this.repository.findAll(tenantId, query);

    return {
      data: users.map(user => this.sanitizeUser(user)),
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(total / (query.limit || 10)),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.repository.findOne(tenantId, id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async update(tenantId: string, id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    await this.findOne(tenantId, id);

    const data: UpdateUserDto = {};

    if (updateUserDto.name !== undefined) {
      const [firstName, ...rest] = updateUserDto.name.trim().split(' ');
      data.firstName = firstName;
      data.lastName = rest.join(' ') || null;
    }

    if (updateUserDto.firstName !== undefined) {
      data.firstName = updateUserDto.firstName;
    }

    if (updateUserDto.lastName !== undefined) {
      data.lastName = updateUserDto.lastName;
    }

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.role !== undefined) {
      data.role = updateUserDto.role;
    }

    if (updateUserDto.isActive !== undefined) {
      data.isActive = updateUserDto.isActive;
    }

    const user = await this.repository.update(tenantId, id, data);

    return this.sanitizeUser(user);
  }

  async remove(tenantId: string, id: string) {
    // Check if user exists
    await this.findOne(tenantId, id);

    // Hard delete user and related data (cascade for relations configured in Prisma schema)
    const user = await this.repository.remove(tenantId, id);

    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: any) {
    const { password, ...result } = user;

    // Ensure `name` is set for UI compatibility (full name)
    const fullName = [result.firstName, result.lastName].filter(Boolean).join(' ').trim();
    return {
      ...result,
      name: fullName || result.email || '',
    };
  }
}
