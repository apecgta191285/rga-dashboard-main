"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedGoogleAdsCommandHandler = void 0;
const tsyringe_1 = require("tsyringe");
const cli_progress_1 = __importDefault(require("cli-progress"));
const base_command_1 = require("./base-command");
const seed_google_ads_command_1 = require("./definitions/seed-google-ads.command");
const google_ads_seeder_service_1 = require("../services/google-ads-seeder.service");
const platform_types_1 = require("../domain/platform.types");
const container_1 = require("../core/container");
class CliProgressReporter {
    constructor() {
        this.bar = new cli_progress_1.default.SingleBar({
            format: 'Seeding |{bar}| {percentage}% | {campaign}',
            barCompleteChar: '█',
            barIncompleteChar: '░',
            hideCursor: true,
            clearOnComplete: false,
            stopOnComplete: true,
        }, cli_progress_1.default.Presets.shades_classic);
    }
    start(total) {
        this.bar.start(total, 0, { campaign: '' });
    }
    update(current, message) {
        this.bar.update(current, { campaign: message || '' });
    }
    stop() {
        this.bar.stop();
        console.log('');
    }
}
let SeedGoogleAdsCommandHandler = class SeedGoogleAdsCommandHandler extends base_command_1.BaseCommandHandler {
    constructor(logger, seederService) {
        super({ logger });
        this.commandName = seed_google_ads_command_1.SEED_GOOGLE_ADS_COMMAND;
        this.seederService = seederService;
    }
    canHandle(command) {
        return (typeof command === 'object' &&
            command !== null &&
            'name' in command &&
            command.name === seed_google_ads_command_1.SEED_GOOGLE_ADS_COMMAND);
    }
    getMetadata() {
        return {
            name: seed_google_ads_command_1.SEED_GOOGLE_ADS_COMMAND,
            displayName: 'Seed Google Ads (Legacy)',
            description: 'Seed 30 days of historical Google Ads data',
            icon: '📊',
            category: 'data',
            estimatedDurationSeconds: 30,
            risks: ['Creates mock data in database'],
        };
    }
    validate(command) {
        if (!command.tenantId || typeof command.tenantId !== 'string') {
            return {
                kind: 'failure',
                error: {
                    name: 'ValidationError',
                    code: 'VALIDATION_ERROR',
                    message: 'tenantId is required and must be a string',
                    isRecoverable: true,
                },
            };
        }
        if (typeof command.days !== 'number' || command.days < 1 || command.days > 365) {
            return {
                kind: 'failure',
                error: {
                    name: 'ValidationError',
                    code: 'VALIDATION_ERROR',
                    message: 'days must be a number between 1 and 365',
                    isRecoverable: true,
                },
            };
        }
        return { kind: 'success', value: undefined };
    }
    async executeCore(command, context) {
        this.logger.info('Starting Google Ads seed', {
            tenantId: command.tenantId,
            days: command.days,
            dryRun: context.dryRun,
        });
        const config = {
            days: command.days,
            platform: platform_types_1.ToolkitPlatform.GoogleAds,
            seedSource: 'seed_google_ads_history',
        };
        await this.seederService.assertSchemaParity();
        const progressReporter = context.dryRun
            ? { start: () => { }, update: () => { }, stop: () => { } }
            : new CliProgressReporter();
        if (context.dryRun) {
            this.logger.info('Dry run mode - skipping actual seeding');
            return {
                kind: 'success',
                value: {
                    success: true,
                    status: 'completed',
                    message: 'Dry run completed - no data was modified',
                    data: {
                        tenantId: command.tenantId,
                        tenantName: 'DRY_RUN',
                        seededCount: 0,
                        campaignCount: 0,
                        dateRange: { start: '', end: '' },
                        campaigns: [],
                    },
                },
            };
        }
        const result = await this.seederService.seed(command.tenantId, config, progressReporter);
        if (result.success) {
            this.logger.info('Google Ads seed completed', {
                status: result.status,
                seededCount: result.data?.seededCount ?? 0,
                campaignCount: result.data?.campaignCount ?? 0,
            });
            return { kind: 'success', value: result };
        }
        else {
            const error = new Error(result.message);
            this.logger.error('Google Ads seed failed', error, {
                status: result.status,
                detail: result.error,
            });
            return {
                kind: 'failure',
                error: {
                    name: 'SeedError',
                    code: result.status === 'no_campaigns' ? 'NO_CAMPAIGNS' : 'SEED_FAILED',
                    message: result.message,
                    isRecoverable: result.status === 'no_campaigns',
                },
            };
        }
    }
};
exports.SeedGoogleAdsCommandHandler = SeedGoogleAdsCommandHandler;
exports.SeedGoogleAdsCommandHandler = SeedGoogleAdsCommandHandler = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(container_1.TOKENS.Logger)),
    __param(1, (0, tsyringe_1.inject)(google_ads_seeder_service_1.GoogleAdsSeederService)),
    __metadata("design:paramtypes", [Object, google_ads_seeder_service_1.GoogleAdsSeederService])
], SeedGoogleAdsCommandHandler);
//# sourceMappingURL=seed-google-ads.handler.js.map