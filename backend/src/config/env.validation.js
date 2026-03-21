"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValidationSchema = void 0;
const Joi = __importStar(require("joi"));
exports.envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required().messages({
    "string.empty": "DATABASE_URL is required",
    "any.required": "DATABASE_URL is required",
  }),
  DIRECT_URL: Joi.string().required().messages({
    "string.empty": "DIRECT_URL is required",
    "any.required": "DIRECT_URL is required",
  }),
  JWT_SECRET: Joi.string().min(32).required().messages({
    "string.min": "JWT_SECRET must be at least 32 characters",
    "any.required": "JWT_SECRET is required",
  }),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    "string.min": "JWT_REFRESH_SECRET must be at least 32 characters",
    "any.required": "JWT_REFRESH_SECRET is required",
  }),
  JWT_ACCESS_EXPIRY: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRY: Joi.string().default("7d"),
  JWT_EXPIRES_IN: Joi.string().optional(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().optional(),
  GOOGLE_CLIENT_ID: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required().messages({
      "any.required": "GOOGLE_CLIENT_ID is required for Google integrations",
    }),
    otherwise: Joi.optional(),
  }),
  GOOGLE_CLIENT_SECRET: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required().messages({
      "any.required":
        "GOOGLE_CLIENT_SECRET is required for Google integrations",
    }),
    otherwise: Joi.optional(),
  }),
  GOOGLE_REDIRECT_URI_ADS: Joi.string().uri().optional(),
  GOOGLE_REDIRECT_URI_ANALYTICS: Joi.string().uri().optional(),
  GOOGLE_ADS_DEVELOPER_TOKEN: Joi.string().optional(),
  FACEBOOK_APP_ID: Joi.string().optional(),
  FACEBOOK_APP_SECRET: Joi.string().optional(),
  FACEBOOK_REDIRECT_URI: Joi.string().uri().optional(),
  TIKTOK_APP_ID: Joi.string().optional(),
  TIKTOK_APP_SECRET: Joi.string().optional(),
  TIKTOK_REDIRECT_URI: Joi.string().uri().optional(),
  TIKTOK_USE_SANDBOX: Joi.string().valid("true", "false").optional(),
  TIKTOK_SANDBOX_ACCESS_TOKEN: Joi.string().optional(),
  TIKTOK_SANDBOX_ADVERTISER_ID: Joi.string().optional(),
  LINE_CHANNEL_ID: Joi.string().optional(),
  LINE_CHANNEL_SECRET: Joi.string().optional(),
  LINE_CALLBACK_URL: Joi.string().uri().optional(),
  CORS_ORIGINS: Joi.string().optional(),
  HIDE_MOCK_DATA: Joi.string().valid("true", "false").optional(),
  FRONTEND_URL: Joi.string()
    .uri()
    .when("NODE_ENV", {
      is: "production",
      then: Joi.required().messages({
        "any.required": "FRONTEND_URL is required in production",
      }),
      otherwise: Joi.optional().default("http://localhost:5173"),
    }),
  APP_URL: Joi.string().uri().optional().default("http://localhost:5173"),
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_SECURE: Joi.boolean().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  SMTP_FROM: Joi.string().optional(),
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  CACHE_TTL: Joi.number().default(600000),
  CACHE_MAX: Joi.number().default(100),
  SWAGGER_TITLE: Joi.string().optional(),
  SWAGGER_DESCRIPTION: Joi.string().optional(),
  SWAGGER_VERSION: Joi.string().optional(),
  GSC_SERVICE_ACCOUNT_JSON: Joi.string().optional(),
  GSC_SERVICE_ACCOUNT_KEY_FILE: Joi.string().optional(),
  GSC_SITE_URL: Joi.string().optional(),
});
//# sourceMappingURL=env.validation.js.map
