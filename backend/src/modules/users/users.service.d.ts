import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto';
export declare class UsersService {
    private readonly repository;
    constructor(repository: UsersRepository);
    create(tenantId: string, createUserDto: CreateUserDto): Promise<any>;
    findAll(tenantId: string, query: QueryUsersDto): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(tenantId: string, id: string): Promise<any>;
    update(tenantId: string, id: string, updateUserDto: UpdateUserDto): Promise<any>;
    remove(tenantId: string, id: string): Promise<any>;
    private sanitizeUser;
}
