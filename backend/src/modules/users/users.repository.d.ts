import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, QueryUsersDto, UpdateUserDto } from './dto';
import { User } from '@prisma/client';
export declare abstract class UsersRepository {
    abstract create(tenantId: string, data: CreateUserDto): Promise<User>;
    abstract findAll(tenantId: string, query: QueryUsersDto): Promise<[User[], number]>;
    abstract findOne(tenantId: string, id: string): Promise<User | null>;
    abstract findByEmail(tenantId: string, email: string): Promise<User | null>;
    abstract update(tenantId: string, id: string, data: UpdateUserDto): Promise<User>;
    abstract remove(tenantId: string, id: string): Promise<User>;
}
export declare class PrismaUsersRepository implements UsersRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, data: CreateUserDto): Promise<User>;
    findAll(tenantId: string, query: QueryUsersDto): Promise<[User[], number]>;
    findOne(tenantId: string, id: string): Promise<User | null>;
    findByEmail(tenantId: string, email: string): Promise<User | null>;
    update(tenantId: string, id: string, data: UpdateUserDto): Promise<User>;
    remove(tenantId: string, id: string): Promise<User>;
}
