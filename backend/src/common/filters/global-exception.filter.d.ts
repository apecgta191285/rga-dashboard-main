import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class BusinessException extends Error {
    readonly code: string;
    readonly message: string;
    readonly statusCode: number;
    readonly meta?: Record<string, any>;
    constructor(code: string, message: string, statusCode?: number, meta?: Record<string, any>);
}
export interface ApiErrorResponse {
    success: false;
    data: null;
    statusCode: number;
    error: string;
    message: string;
    meta?: Record<string, any>;
    timestamp: string;
    path: string;
}
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
    private inferErrorCode;
}
