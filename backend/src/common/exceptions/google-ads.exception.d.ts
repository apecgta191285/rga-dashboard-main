import { BadRequestException } from '@nestjs/common';
export declare class GoogleAdsException extends BadRequestException {
    readonly errorCode: string;
    readonly details?: any;
    constructor(message: string, errorCode: string, details?: any);
}
export declare class GoogleAdsAuthException extends GoogleAdsException {
    constructor(message: string, details?: any);
}
export declare class GoogleAdsFetchException extends GoogleAdsException {
    constructor(message: string, details?: any);
}
export declare class GoogleAdsSyncException extends GoogleAdsException {
    constructor(message: string, details?: any);
}
export declare class GoogleAdsAccountNotFoundException extends GoogleAdsException {
    constructor(accountId: string);
}
