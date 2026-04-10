/**
 * WhatsApp Bot Configuration
 * Centralized configuration settings for the bot
 */

require('dotenv').config({ path: './config.env' });

const config = {
    // Bot Information
    bot: {
        name: process.env.BOT_NAME || 'WhatsApp Bot',
        version: '1.0.0',
        prefix: process.env.BOT_PREFIX || '!',
        owner: process.env.BOT_OWNER || '',
        ownerNumber: process.env.OWNER_NUMBER || '',
        description: process.env.BOT_DESCRIPTION || 'Advanced WhatsApp Bot',
        sessionName: process.env.SESSION_NAME || 'whatsapp-bot-session'
    },

    // WhatsApp Settings
    whatsapp: {
        authFolder: process.env.AUTH_FOLDER || './data/auth',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB
        typingDelay: parseInt(process.env.TYPING_DELAY) || 1000,
        readReceipts: process.env.READ_RECEIPTS === 'true' || true,
        autoRead: process.env.AUTO_READ === 'true' || false,
        autoTyping: process.env.AUTO_TYPING === 'true' || true
    },

    // Web Server Settings
    web: {
        enabled: process.env.WEB_ENABLED === 'true' || true,
        port: parseInt(process.env.WEB_PORT) || 3000,
        host: process.env.WEB_HOST || '0.0.0.0',
        title: process.env.WEB_TITLE || 'WhatsApp Bot Dashboard',
        theme: process.env.WEB_THEME || 'dark',
        rateLimit: parseInt(process.env.RATE_LIMIT) || 100,
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this',
        adminUsername: process.env.ADMIN_USERNAME || 'admin',
        adminPassword: process.env.ADMIN_PASSWORD || 'admin123'
    },

    // Database Settings
    database: {
        type: process.env.DB_TYPE || 'json',
        path: process.env.DB_PATH || './data/database',
        backupInterval: parseInt(process.env.BACKUP_INTERVAL) || 3600000 // 1 hour
    },

    // Plugin Settings
    plugins: {
        folder: process.env.PLUGINS_FOLDER || './plugins',
        autoLoad: process.env.PLUGINS_AUTOLOAD === 'true' || true,
        enabled: process.env.PLUGINS_ENABLED?.split(',') || ['all']
    },

    // Media Settings
    media: {
        folder: process.env.MEDIA_FOLDER || './media',
        tempFolder: process.env.TEMP_FOLDER || './temp',
        maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE) || 10 * 1024 * 1024, // 10MB
        maxVideoSize: parseInt(process.env.MAX_VIDEO_SIZE) || 50 * 1024 * 1024, // 50MB
        maxAudioSize: parseInt(process.env.MAX_AUDIO_SIZE) || 20 * 1024 * 1024, // 20MB
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedVideoTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/webm'],
        allowedAudioTypes: ['audio/mp3', 'audio/ogg', 'audio/wav', 'audio/mpeg']
    },

    // Feature Toggles
    features: {
        welcomeMessage: process.env.FEATURE_WELCOME === 'true' || true,
        goodbyeMessage: process.env.FEATURE_GOODBYE === 'true' || false,
        antiSpam: process.env.FEATURE_ANTISPAM === 'true' || true,
        autoReply: process.env.FEATURE_AUTOREPLY === 'true' || false,
        commandLogging: process.env.FEATURE_CMDLOG === 'true' || true,
        messageLogging: process.env.FEATURE_MSGLOG === 'true' || false
    },

    // API Keys (for external services)
    api: {
        openai: process.env.OPENAI_API_KEY || '',
        google: process.env.GOOGLE_API_KEY || '',
        weather: process.env.WEATHER_API_KEY || '',
        news: process.env.NEWS_API_KEY || '',
        translate: process.env.TRANSLATE_API_KEY || ''
    },

    // Language Settings
    language: {
        default: process.env.DEFAULT_LANG || 'en',
        supported: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi', 'id'],
        autoDetect: process.env.AUTO_DETECT_LANG === 'true' || true
    },

    // Logging Settings
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        folder: process.env.LOG_FOLDER || './logs',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 10,
        maxSize: process.env.LOG_MAX_SIZE || '10m',
        console: process.env.LOG_CONSOLE === 'true' || true,
        file: process.env.LOG_FILE === 'true' || true
    },

    // Security Settings
    security: {
        enableCors: process.env.ENABLE_CORS === 'true' || true,
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
        enableHelmet: process.env.ENABLE_HELMET === 'true' || true,
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
        maxRequests: parseInt(process.env.MAX_REQUESTS) || 100
    },

    // Advanced Settings
    advanced: {
        baileysVersion: [2, 3000, 1015901307],
        browserName: process.env.BROWSER_NAME || 'WhatsApp Bot',
        browserVersion: process.env.BROWSER_VERSION || '1.0.0',
        connectTimeoutMs: parseInt(process.env.CONNECT_TIMEOUT) || 60000,
        keepAliveIntervalMs: parseInt(process.env.KEEP_ALIVE_INTERVAL) || 30000,
        printQRInTerminal: process.env.PRINT_QR === 'true' || true
    }
};

module.exports = config;
