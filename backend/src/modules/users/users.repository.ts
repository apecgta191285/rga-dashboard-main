import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, QueryUsersDto, UpdateUserDto } from './dto';
import { User, Prisma } from '@prisma/client';

export abstract class UsersRepository {
    abstract create(tenantId: string, data: CreateUserDto): Promise<User>;
    abstract findAll(tenantId: string, query: QueryUsersDto): Promise<[User[], number]>;
    abstract findOne(tenantId: string, id: string): Promise<User | null>;
    abstract findByEmail(tenantId: string, email: string): Promise<User | null>;
    abstract update(tenantId: string, id: string, data: UpdateUserDto): Promise<User>;
    abstract remove(tenantId: string, id: string): Promise<User>;
}

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(tenantId: string, data: CreateUserDto): Promise<User> {
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role || 'CLIENT',
                isActive: data.isActive !== undefined ? data.isActive : true,
                tenantId,
            },
        });
    }

    async findAll(tenantId: string, query: QueryUsersDto): Promise<[User[], number]> {
        const { role, isActive, search, page = 1, limit = 10, sortBy, sortOrder } = query;
        const where: Prisma.UserWhereInput = { tenantId };

        if (role) where.role = role;
        if (isActive !== undefined) where.isActive = isActive;
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const orderByField = sortBy || 'createdAt';
        const orderByDirection = sortOrder || 'desc';
        const orderBy: any = {};
        orderBy[orderByField] = orderByDirection;

        return Promise.all([
            this.prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy,
            }),
            this.prisma.user.count({ where }),
        ]);
    }

    async findOne(tenantId: string, id: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { id, tenantId },
        });
    }

    async findByEmail(tenantId: string, email: string): Promise<User | null> {
        // Schema V2: email is unique per tenant, use compound unique
        return this.prisma.user.findUnique({
            where: {
                users_tenant_email_unique: {
                    tenantId,
                    email,
                },
            },
            include: { tenant: true },
        });
    }

    async update(tenantId: string, id: string, data: UpdateUserDto): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async remove(tenantId: string, id: string): Promise<User> {
        // Hard delete user and preserve constraints for optional relations
        return this.prisma.$transaction(async (tx) => {
            // unlink from optional relations that don't cascade automatically
            await tx.auditLog.updateMany({
                where: { userId: id },
                data: { userId: null },
            });

            await tx.report.updateMany({
                where: { createdBy: id },
                data: { createdBy: null },
            });

            // delete user record (cascade deletes connected entities with onDelete: Cascade)
            return tx.user.delete({
                where: { id },
            });
        });
    }
}
