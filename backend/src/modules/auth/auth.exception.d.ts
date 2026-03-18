import { UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
export declare class InvalidCredentialsException extends UnauthorizedException {
    constructor(remainingAttempts?: number);
}
export declare class AccountLockedException extends UnauthorizedException {
    constructor(lockoutMinutes: number);
}
export declare class TokenExpiredException extends UnauthorizedException {
    constructor();
}
export declare class TokenRevokedException extends UnauthorizedException {
    constructor();
}
export declare class UserNotFoundException extends UnauthorizedException {
    constructor();
}
export declare class AccountInactiveException extends ForbiddenException {
    constructor();
}
export declare class EmailNotVerifiedException extends ForbiddenException {
    constructor();
}
export declare class InvalidEmailVerificationTokenException extends UnauthorizedException {
    constructor();
}
export declare class EmailVerificationTokenExpiredException extends UnauthorizedException {
    constructor();
}
export declare class EmailExistsException extends ConflictException {
    constructor();
}
export declare class UsernameExistsException extends ConflictException {
    constructor();
}
export declare class TermsNotAcceptedException extends ForbiddenException {
    constructor();
}
