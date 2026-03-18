"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdsAccountNotFoundException = exports.GoogleAdsSyncException = exports.GoogleAdsFetchException = exports.GoogleAdsAuthException = exports.GoogleAdsException = void 0;
const common_1 = require("@nestjs/common");
class GoogleAdsException extends common_1.BadRequestException {
    constructor(message, errorCode, details) {
        super({
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            message,
            error: errorCode,
            details,
            timestamp: new Date().toISOString(),
        });
        this.errorCode = errorCode;
        this.details = details;
    }
}
exports.GoogleAdsException = GoogleAdsException;
class GoogleAdsAuthException extends GoogleAdsException {
    constructor(message, details) {
        super(message, 'GOOGLE_ADS_AUTH_FAILED', details);
    }
}
exports.GoogleAdsAuthException = GoogleAdsAuthException;
class GoogleAdsFetchException extends GoogleAdsException {
    constructor(message, details) {
        super(message, 'GOOGLE_ADS_FETCH_FAILED', details);
    }
}
exports.GoogleAdsFetchException = GoogleAdsFetchException;
class GoogleAdsSyncException extends GoogleAdsException {
    constructor(message, details) {
        super(message, 'GOOGLE_ADS_SYNC_FAILED', details);
    }
}
exports.GoogleAdsSyncException = GoogleAdsSyncException;
class GoogleAdsAccountNotFoundException extends GoogleAdsException {
    constructor(accountId) {
        super(`Google Ads account not found: ${accountId}`, 'GOOGLE_ADS_ACCOUNT_NOT_FOUND', { accountId });
    }
}
exports.GoogleAdsAccountNotFoundException = GoogleAdsAccountNotFoundException;
//# sourceMappingURL=google-ads.exception.js.map