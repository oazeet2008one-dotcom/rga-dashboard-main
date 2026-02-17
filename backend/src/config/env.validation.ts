import * as Joi from 'joi';

/**
 * Environment Variable Validation Schema
 * ตรวจสอบว่า .env มีค่าที่จำเป็นครบถ้วนก่อน startup
 */
export const envValidationSchema = Joi.object({
    // ============================================
    // Server Configuration
    // ============================================
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().default(3000),

    // ============================================
    // Database
    // ============================================
    DATABASE_URL: Joi.string().required().messages({
        'string.empty': 'DATABASE_URL is required',
        'any.required': 'DATABASE_URL is required',
    }),
    DIRECT_URL: Joi.string().required().messages({
        'string.empty': 'DIRECT_URL is required',
        'any.required': 'DIRECT_URL is required',
    }),

    // ============================================
    // JWT Authentication
    // ============================================
    JWT_SECRET: Joi.string().min(32).required().messages({
        'string.min': 'JWT_SECRET must be at least 32 characters',
        'any.required': 'JWT_SECRET is required',
    }),
    JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
        'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters',
        'any.required': 'JWT_REFRESH_SECRET is required',
    }),
    JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
    JWT_EXPIRES_IN: Joi.string().optional(),
    JWT_REFRESH_EXPIRES_IN: Joi.string().optional(),

    // ============================================
    // Google OAuth (Required for integrations)
    // ============================================
    GOOGLE_CLIENT_ID: Joi.string().when('NODE_ENV', {
        is: 'production',
        then: Joi.required().messages({
            'any.required': 'GOOGLE_CLIENT_ID is required for Google integrations',
        }),
        otherwise: Joi.optional(),
    }),
    GOOGLE_CLIENT_SECRET: Joi.string().when('NODE_ENV', {
        is: 'production',
        then: Joi.required().messages({
            'any.required': 'GOOGLE_CLIENT_SECRET is required for Google integrations',
        }),
        otherwise: Joi.optional(),
    }),
    GOOGLE_REDIRECT_URI_ADS: Joi.string().uri().optional(),
    GOOGLE_REDIRECT_URI_ANALYTICS: Joi.string().uri().optional(),
    GOOGLE_ADS_DEVELOPER_TOKEN: Joi.string().optional(),

    // ============================================
    // Facebook OAuth (Optional)
    // ============================================
    FACEBOOK_APP_ID: Joi.string().optional(),
    FACEBOOK_APP_SECRET: Joi.string().optional(),
    FACEBOOK_REDIRECT_URI: Joi.string().uri().optional(),

    // ============================================
    // TikTok OAuth (Optional)
    // ============================================
    TIKTOK_APP_ID: Joi.string().optional(),
    TIKTOK_APP_SECRET: Joi.string().optional(),
    TIKTOK_REDIRECT_URI: Joi.string().uri().optional(),
    TIKTOK_USE_SANDBOX: Joi.string().valid('true', 'false').optional(),
    TIKTOK_SANDBOX_ACCESS_TOKEN: Joi.string().optional(),
    TIKTOK_SANDBOX_ADVERTISER_ID: Joi.string().optional(),

    // ============================================
    // LINE OAuth (Optional)
    // ============================================
    LINE_CHANNEL_ID: Joi.string().optional(),
    LINE_CHANNEL_SECRET: Joi.string().optional(),
    LINE_CALLBACK_URL: Joi.string().uri().optional(),

    // ============================================
    // CORS & Security
    // ============================================
    CORS_ORIGINS: Joi.string().optional(),

    HIDE_MOCK_DATA: Joi.string().valid('true', 'false').optional(),

    // Frontend URL - required in production, has default in development
    FRONTEND_URL: Joi.string()
        .uri()
        .when('NODE_ENV', {
            is: 'production',
            then: Joi.required().messages({
                'any.required': 'FRONTEND_URL is required in production',
            }),
            otherwise: Joi.optional().default('http://localhost:5173'),
        }),

    // ============================================
    // Email Verification (SMTP)
    // ============================================
    APP_URL: Joi.string()
        .uri()
        .optional()
        .default('http://localhost:5173'),
    SMTP_HOST: Joi.string().optional(),
    SMTP_PORT: Joi.number().optional(),
    SMTP_SECURE: Joi.boolean().optional(),
    SMTP_USER: Joi.string().optional(),
    SMTP_PASS: Joi.string().optional(),
    SMTP_FROM: Joi.string().optional(),
    // ============================================
    // Rate Limiting
    // ============================================
    THROTTLE_TTL: Joi.number().default(60000),
    THROTTLE_LIMIT: Joi.number().default(100),

    // ============================================
    // Cache
    // ============================================
    CACHE_TTL: Joi.number().default(600000), // 10 minutes
    CACHE_MAX: Joi.number().default(100),

    // ============================================
    // Swagger
    // ============================================
    SWAGGER_TITLE: Joi.string().optional(),
    SWAGGER_DESCRIPTION: Joi.string().optional(),
    SWAGGER_VERSION: Joi.string().optional(),

    GSC_SERVICE_ACCOUNT_JSON: Joi.string().optional(),
    GSC_SERVICE_ACCOUNT_KEY_FILE: Joi.string().optional(),
    GSC_SITE_URL: Joi.string().optional(),
});
