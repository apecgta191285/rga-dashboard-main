import { UserRole } from '@prisma/client';
export declare class TenantDto {
    id: string;
    name: string;
}
export declare class UserResponseDto {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    tenant: TenantDto;
}
export declare class AuthTokensDto {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthResponseDto extends AuthTokensDto {
    user: UserResponseDto;
}
export declare class RefreshResponseDto extends AuthTokensDto {
}
