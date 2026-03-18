"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TermsNotAcceptedException = exports.UsernameExistsException = exports.EmailExistsException = exports.EmailVerificationTokenExpiredException = exports.InvalidEmailVerificationTokenException = exports.EmailNotVerifiedException = exports.AccountInactiveException = exports.UserNotFoundException = exports.TokenRevokedException = exports.TokenExpiredException = exports.AccountLockedException = exports.InvalidCredentialsException = void 0;
const common_1 = require("@nestjs/common");
class InvalidCredentialsException extends common_1.UnauthorizedException {
    constructor(remainingAttempts) {
        const hasRemainingInfo = remainingAttempts !== undefined && remainingAttempts > 0;
        super({
            error: 'INVALID_CREDENTIALS',
            message: hasRemainingInfo
                ? `Invalid credentials. ${remainingAttempts} attempts remaining.`
                : 'Invalid credentials',
            meta: hasRemainingInfo ? { remainingAttempts } : undefined,
        });
    }
}
exports.InvalidCredentialsException = InvalidCredentialsException;
class AccountLockedException extends common_1.UnauthorizedException {
    constructor(lockoutMinutes) {
        super({
            error: 'ACCOUNT_LOCKED',
            message: `Account is locked. Try again in ${lockoutMinutes} minutes.`,
            meta: { lockoutMinutes },
        });
    }
}
exports.AccountLockedException = AccountLockedException;
class TokenExpiredException extends common_1.UnauthorizedException {
    constructor() {
        super({
            error: 'TOKEN_EXPIRED',
            message: 'Your session has expired. Please login again.',
        });
    }
}
exports.TokenExpiredException = TokenExpiredException;
class TokenRevokedException extends common_1.UnauthorizedException {
    constructor() {
        super({
            error: 'TOKEN_REVOKED',
            message: 'Token has been revoked. Please login again.',
        });
    }
}
exports.TokenRevokedException = TokenRevokedException;
class UserNotFoundException extends common_1.UnauthorizedException {
    constructor() {
        super({
            error: 'USER_NOT_FOUND',
            message: 'User not found',
        });
    }
}
exports.UserNotFoundException = UserNotFoundException;
class AccountInactiveException extends common_1.ForbiddenException {
    constructor() {
        super({
            error: 'ACCOUNT_INACTIVE',
            message: 'Account is deactivated. Please contact support.',
        });
    }
}
exports.AccountInactiveException = AccountInactiveException;
class EmailNotVerifiedException extends common_1.ForbiddenException {
    constructor() {
        super({
            error: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email before logging in.',
        });
    }
}
exports.EmailNotVerifiedException = EmailNotVerifiedException;
class InvalidEmailVerificationTokenException extends common_1.UnauthorizedException {
    constructor() {
        super({
            error: 'INVALID_EMAIL_VERIFICATION_TOKEN',
            message: 'Invalid verification token.',
        });
    }
}
exports.InvalidEmailVerificationTokenException = InvalidEmailVerificationTokenException;
class EmailVerificationTokenExpiredException extends common_1.UnauthorizedException {
    constructor() {
        super({
            error: 'EMAIL_VERIFICATION_TOKEN_EXPIRED',
            message: 'Verification token has expired. Please request a new one.',
        });
    }
}
exports.EmailVerificationTokenExpiredException = EmailVerificationTokenExpiredException;
class EmailExistsException extends common_1.ConflictException {
    constructor() {
        super({
            error: 'EMAIL_EXISTS',
            message: 'This email is already registered. Please login instead.',
        });
    }
}
exports.EmailExistsException = EmailExistsException;
class UsernameExistsException extends common_1.ConflictException {
    constructor() {
        super({
            error: 'USERNAME_EXISTS',
            message: 'This username is already taken. Please choose another one.',
        });
    }
}
exports.UsernameExistsException = UsernameExistsException;
class TermsNotAcceptedException extends common_1.ForbiddenException {
    constructor() {
        super({
            error: 'TERMS_NOT_ACCEPTED',
            message: 'You must accept the Terms & Conditions to create an account.',
        });
    }
}
exports.TermsNotAcceptedException = TermsNotAcceptedException;
//# sourceMappingURL=auth.exception.js.map