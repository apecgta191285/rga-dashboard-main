"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = exports.BusinessException = void 0;
const common_1 = require("@nestjs/common");
class BusinessException extends Error {
    constructor(code, message, statusCode = 400, meta) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.meta = meta;
        this.name = 'BusinessException';
    }
}
exports.BusinessException = BusinessException;
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let errorCode = 'INTERNAL_ERROR';
        let message = 'An unexpected error occurred';
        let meta = undefined;
        if (exception instanceof BusinessException) {
            status = exception.statusCode;
            errorCode = exception.code;
            message = exception.message;
            meta = exception.meta;
        }
        else if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object') {
                const res = exceptionResponse;
                message = Array.isArray(res.message)
                    ? res.message.join(', ')
                    : res.message || exception.message;
                errorCode = res.error || this.inferErrorCode(status);
                meta = res.meta;
            }
            else {
                message = exceptionResponse;
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
        }
        this.logger.error(`${request.method} ${request.url} - ${status} - ${errorCode} - ${message}`, exception instanceof Error ? exception.stack : undefined);
        const errorResponse = {
            success: false,
            data: null,
            statusCode: status,
            error: errorCode,
            message,
            ...(meta && { meta }),
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        response.status(status).json(errorResponse);
    }
    inferErrorCode(status) {
        switch (status) {
            case common_1.HttpStatus.BAD_REQUEST:
                return 'BAD_REQUEST';
            case common_1.HttpStatus.UNAUTHORIZED:
                return 'UNAUTHORIZED';
            case common_1.HttpStatus.FORBIDDEN:
                return 'FORBIDDEN';
            case common_1.HttpStatus.NOT_FOUND:
                return 'NOT_FOUND';
            case common_1.HttpStatus.CONFLICT:
                return 'CONFLICT';
            case common_1.HttpStatus.UNPROCESSABLE_ENTITY:
                return 'VALIDATION_ERROR';
            case common_1.HttpStatus.TOO_MANY_REQUESTS:
                return 'TOO_MANY_REQUESTS';
            default:
                return 'INTERNAL_ERROR';
        }
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map