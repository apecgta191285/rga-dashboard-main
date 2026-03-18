import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class ToolkitInternalGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
